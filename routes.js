// LINK TO DATABASE CONNECTION
const pool = require('./config.js')
var path = require("path");

// PODCAST CREDENTIALS
const unirest = require('unirest');
const sourceFile = require('./ConfigPodcasts.js');
console.log("imported key: ", sourceFile.podcastAPIKey);

// google auth
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = '170958026096-1delfs3g8tg4hoeg6bgs5ickhpe7k5pt.apps.googleusercontent.com' // Given by Google when you set up your Google OAuth client ID: https://developers.google.com/identity/sign-in/web/sign-in

//VERIFICATION FUNCTION: The ticket inspector
// Check authenticity of user id - basically like ticket inspector
// take the token and verify it and if it is good then gives back user id (from google)
// if token is 'wrong' (expired/ doesn't exist etc.) it returns false
// so this only returns user if if an active true token exists in the browser

async function verify(CLIENT_ID, token) {
    const client = new OAuth2Client(CLIENT_ID);
    try {
        const ticket = await client.verifyIdToken({ // Function to inspect the user's "ticket" (token)
            idToken: token,
            audience: CLIENT_ID
        });

        const payload = ticket.getPayload(); // The verified token gives back a ticket. This ticket contains things like user ID, email and profile picture (all from a user's Google Account)
        //console.log('payload= ', payload)
        const AuthUserId = payload.sub;
        const UserName = payload.name;
        const UserEmail = payload.email;
        const UserPicture = payload.picture;
        return [AuthUserId, UserName, UserEmail, UserPicture]

    } catch (error) {
        return false
    }
};
//FUNCTION TO TAKE BROWSER SESSION TOKEN & RETURN PARTAGR USER ID
async function TokenToUserID(user_session_token) {
    VerifiedTokenPayload = await verify(CLIENT_ID, user_session_token)
    var google_user_id = VerifiedTokenPayload[0]
    try {
        pool.query("SELECT user_id FROM user_profile WHERE google_user_id = ?", google_user_id, function (error, result) {
            return result[0].user_id
            if (result == null) {
                console.log('TokenToUserID: No matching user ID')
            } else {
                console.log('The result to be returned from calling this function: ', result[0].user_id)
                return result[0].user_id
            }
        });
    } catch (err) {
        console.log('TokenToUserID ' + err)
    }
}

  
// DEFINE APP
const router = app => {



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// *** VIEW A PROFILE & SIGN IN *** ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // HOME: DESCRIPTION
    // 1) Display landing page
    app.get('/', (request, response) => {
        homepage_file = "/homepage.html"
        response.sendFile(homepage_file, { root: __dirname })
    });


    // SIGN IN: DESCRIPTION 
    //VERIFY USER & POST NEW USER TO DATABASE IF NECESSARY: SET COOKIE VALUE IN BROWSER
    app.post('/SignIn', async (request, response) => {
        let token = request.body.token
        VerifiedTokenPayload = await verify(CLIENT_ID, token)

        if (!VerifiedTokenPayload) { // if value == false
            response.send('* Token verification FAIL: User not logged in *')

        } else { //Token has been verified
            response.cookie('USER_SESSION_TOKEN', token) // Setting a verified token in the browser
            var google_user_id = VerifiedTokenPayload[0]
            var google_user_name = VerifiedTokenPayload[1]
            var google_first_name = google_user_name.split(" ", 1)[0]
            var google_email = VerifiedTokenPayload[2]
            var google_profile_picture = VerifiedTokenPayload[3]

            // Here the name before the colon corresponds to the field name in the table we created, the name after corresponds to the data, found in the verified token, above.
            var new_user_data = {
                google_user_id: google_user_id, first_name: google_first_name, full_name: google_user_name,
                email: google_email, profile_picture: google_profile_picture
            }
            console.log("Checking if user already exists...")
            try { // CHECK IF USER ALREADY EXISTS IN DATABASE
                pool.query("SELECT * FROM user_profile WHERE google_user_id = ?", google_user_id, function (error, result) {
                   console.log("Result from existing user check: ", result)
                    // User not in user_profile table => This is a New User
                    if (result.length === 0) {
                        console.log('No result from existing user query: Inserting new user into user_profile DB')
                        try {  //INSERT NEW USER INTO: USER_PROFILE
                            pool.query('INSERT INTO user_profile SET?', new_user_data, (error, result) => {
                            });
                        } catch (error) {
                            console.log('Unable to create new user, error: ', error)
                        }
                        response.send(true); //New user added
                        console.log("New user added")
                        // User exists in user_profile table => This is NOT a New User
                    } else {
                        response.send(true); //Existing user- signing in
                        console.log("Existing user signing in")
                    }
                });
            } catch (err) {
                console.log('Sign up route fail: ' + err)
            }
        }
    });

    // POST PROFILE ROUTE: DESCRIPTION 
    // FUNCTION: Deliever profile user id to FrontEnd based on the token given after a user signs in
    // 1) Validates token sent from FE
    // 2) If valid, find google_user_id from verified token
    // 3) Find associated (app) user Id
    // 4) Send to FE
    app.post('/ProfileRoute', async (request, response) => {
        token = request.body.token
        VerifiedTokenPayload = await verify(CLIENT_ID, token)

        if (!VerifiedTokenPayload) { //if value == false
            response.send('* Token verification FAIL: User not logged in *')

        } else { //Token has been verified
            google_user_id = VerifiedTokenPayload[0]
            // FIND APP USER ID (use internal app ID, rather than google id to identify a user)
            try{
            pool.query("SELECT user_id FROM user_profile WHERE google_user_id = ?", google_user_id, (error, result) => { // value of app user id on row of google user id 
                if (error) throw console.log('Find user ID error: ', error);
                user_id = result[0].user_id
                var SuccessResponseArray = ["* Token verification SUCCESS: User logged in *", user_id]
                response.send(SuccessResponseArray)
            }); // FIND APP USER ID: END
        } catch(error){
            console.log("Error likely due to database not existing: ", error)
        }
        } // END OF IF/ELSE CLAUSE VERIFICATION CLAUSE
    }); // END OF POST: PROFILE ROUTE


    // GET PROFILEPAGE ROUTE: DESCRIPTION
    // FUNCTION: Display a user's profile, with relevant data
    // 1) Take query parameter from browser (this is what is seen in the browser's URL)
    // 2) SELECT all fields from user_profile corresponding to the user's ID
    // 3) If no result is returned, send "User does not exist error", else;
    // 4) Render (display) the user's profile page, with dynamically updated data for first name, user id and profile picture.
    app.get('/ProfilePage', (request, response) => {
        user_id = request.query.user_id // User Id set as a cookie in /ProfileRoute and retrieved in FE FROM the response (but also could have been retrieved from the cookie)
        // RETRIEVE APP USER DATA
        try {
            pool.query("SELECT * FROM user_profile WHERE user_id = ?", user_id, (error, result) => {
                if (result.length === 0) {
                    response.send('Error: User does not exist. Please enter an existing user id in the url.')
                } else {
                    user_data = result[0]
                    response.render("ProfilePage.ejs", {
                        data: {
                            name: user_data.first_name, user_id: user_data.user_id,
                            profile_picture: user_data.profile_picture
                        }
                    }); // END OF RESPONSE.RENDER PROTECTED PROFILE
                } // END OF IF/ELSE CLAUSE
            }); // RETRIEVE APP USER DATA: END
        } catch (error) {
            console.log('Error retrieving user data, error: ', error)
        }
    }) // END OF GET: PROTECTED PROFILE

// GET MY PROFILE: DESCRIPTION
    // FUNCTION: DISPLAY THE PROFILE OF THE LOGGED IN USER
    // 1) Take user_session_token from browser
    // 2) Use TokenToUserID to find corresponding partagr ID
    // 3) response.send this ID back to client
    
    app.post("/MyProfile", async (request, response) => {
        token = request.body.token
        console.log('The token is: ', token)
        VerifiedTokenPayload = await verify(CLIENT_ID, token)
        
    var google_user_id = VerifiedTokenPayload[0]
    try {
        pool.query("SELECT user_id FROM user_profile WHERE google_user_id = ?", google_user_id, function (error, result) {
            if (result == null) {
                console.log('TokenToUserID: No matching user ID')
            } else {
                console.log('The result to be returned from calling this function: ', result[0].user_id)
                corresponding_user_id = result[0].user_id.toString()
                console.log('the output of token to user = ', corresponding_user_id)
                response.send(corresponding_user_id)
            }
        })
    } catch (err) {
        console.log('TokenToUserID ' + err)
    }
    
})
  


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// *** EDIT PROFILE *** ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    /// THE FOLLOWING ROUTES REQUIRE TWO CONDITIONS:
    // 1) THE USER IS SIGNED IN WITH A VALID TOKEN
    // 2) THE USER IS ON HER OWN PAGE

    // IF THESE CONDITIONS ARE MET, THE USER CAN EDIT HER PAGE.

    // GET OWNER ROUTE: DESCRIPTION
    // FUNCTION: Check whether the profile viewer is the profile owner- e.g. are you viewing your own profile, or your friend's?
    // 1) Verify token, taken from browser is valid
    // 2) If valid, find google user id associated with valid token = FrontEndGoogleUserId
    // 3) Find StoredGoogleUserId corresponding to profile (user) Id- taken from browser url
    // 4) Compare FrontEndGoogleUserId (from token) with StoredGoogleUserID (corresponding to profile ID)
    // 5) If both match, the logged in user (from token) has the same google ID as that which is associated with the profile user id => The logged in user is viewing her own profile, and not someone else's
    app.get("/Owner", async (request, response) => {
        ProfileUserId = request.query.ProfileId
        token = request.query.token

        VerifiedTokenPayload = await verify(CLIENT_ID, token)
        var FrontEndGoogleUserId = VerifiedTokenPayload[0] //Google user ID
        if (!VerifiedTokenPayload) { //if value == false
            response.send('TOKEN FAIL')
        } else {
            // Now we ensure that this token corresponds to the ProfileUserId (the user Id seen in the browser url)
            try {
                pool.query("SELECT google_user_id FROM user_profile WHERE user_id = ?", ProfileUserId, (error, result) => { // value of app user id on row of google user id                   
                    StoredGoogleUserID = result[0].google_user_id
                    if (FrontEndGoogleUserId == StoredGoogleUserID) {
                        console.log('Authorised user editing correct profile')
                        response.send('User is profile owner')
                    } else {
                        response.send('User is not profile owner')
                    }
                });
            } catch (error) {
                console.log('Error from check that token matches profile')
            }
        }
    });

    // POST ADDVIDEO ROUTE: DESCRIPTION
    // FUNCTION: ENABLE USER TO ADD CONTENT (BUT ONLY TO HER PAGE)
    // 1) Verify token, taken from browser is valid
    // 2) If valid, find google user id associated with valid token = FrontEndGoogleUserId
    // 3) Find StoredGoogleUserId corresponding to profile (user) Id- taken from browser url
    // 4) Compare FrontEndGoogleUserId (from token) with StoredGoogleUserID (corresponding to profile ID)
    // 5) If both match, the logged in user (from token) has the same google ID as that which is associated with the profile user id
    // 6) Insert content (VideoLink) into user_content table

    //DEFINE INSERT VIDEO FUNCTION
    async function InsertNewVideo(InsertVideoData) {
        try { // INSET VIDEO -> MAKE THIS INTO A FUCNTION; can make this async
            console.log("Test sequence step: C")

            var InsertVideoResult = pool.query('INSERT INTO user_content SET ?', InsertVideoData) //, (InsertVideoError, InsertVideoResult) => {
            //console.log('insert new video in position error: ', InsertVideoError)
            //console.log('insert new video in position result: ', InsertVideoResult)
            if (InsertVideoResult !== null) {
                // console.log('FUNCTION = TRUE')
                console.log("Test sequence step: C ii")

                //response.send(true)
                return true
            } else {
                console.log('Insertion error: ', InsertVideoError)
                //response.send('Video not Added')
                return "Video not added"
            }
            // });
        } catch (error) {
            console.log('Something went wrong, video not added: ', error)
            //response.send('Video not Added')
            return "Video not added"
        }
    }


    app.post("/AddYouTubeVideo", async (request, response) => {
        console.log('**********************************')
        token = request.body.token
        ProfileUserId = request.body.ProfileId
        VideoID = request.body.VideoID
        VideoPosition = request.body.Position
        console.log('** NEW video id ', VideoID)
        console.log('** NEW video position ', VideoPosition)

        VerifiedTokenPayload = await verify(CLIENT_ID, token)
        var FrontEndGoogleUserId = VerifiedTokenPayload[0] //Google user ID
        console.log('verified token payload = ', VerifiedTokenPayload)
        if (!VerifiedTokenPayload) { //if value == false
            response.send('TOKEN FAIL')
        } else { //Token has been verified
            console.log("CONTINUE AFTER TOKEN CHECK")
            // Now we ensure that this token corresponds to the ProfileUserId (the user Id seen in the browser url)
            try { // SELECT GOOGLE ID
                pool.query("SELECT google_user_id FROM user_profile WHERE user_id = ?", ProfileUserId, (error, result) => { // value of app user id on row of google user id 
                    StoredGoogleUserID = result[0].google_user_id
                    if (FrontEndGoogleUserId == StoredGoogleUserID) {
                        //console.log('Authorised user editing correct profile: VIDEO')
                        InsertVideoData = { user_id: ProfileUserId, content: VideoID, content_type: "video", content_desc: VideoPosition }

                        // ADD VIDEO LINK TO DATA BASE
                        // ENSURE POSITION IS EMPTY FIRST
                        console.log("CHECK VIDEO POSITION STATUS")
                        let CheckIfAlreadyFullQuery = "SELECT content_desc FROM user_content WHERE user_id = ? AND content_type = 'video' AND content_desc =?"
                        pool.query(CheckIfAlreadyFullQuery, [ProfileUserId, VideoPosition], (error, PreviouslyPopulatedResult) => {
                            // console.log('check if already populated error: ', error)
                            //console.log('check if already populated result: ', PreviouslyPopulatedResult)
                            if (PreviouslyPopulatedResult == null) {
                                    console.log('NO PREVIOUS VIDEO')
                                   var InsertVideoResult = InsertNewVideo(InsertVideoData)
                                   response.send(InsertVideoResult) // this was previous commented out
                            }    
                            else if (PreviouslyPopulatedResult.length > 0) {
                                //  console.log('VIDEO ALREADY IN PLACE: DELETING')
                                let DeleteIfAlreadyFullQuery = "DELETE FROM user_content WHERE user_id = ? AND content_type = 'video' AND content_desc =?"
                                pool.query(DeleteIfAlreadyFullQuery, [ProfileUserId, VideoPosition], (error, result) => {
                                    //  console.log('delete existing video in position error: ', error)
                                    //  console.log('delete existing video in position result: ', result)

                                    var ResponseToSend = InsertNewVideo(InsertVideoData)
                                    Promise.resolve(ResponseToSend).then(function (value) {
                                        console.log('in function value: ', value)
                                        response.send(value)
                                    })


                                });

                            } else {
                                //  console.log('NO PREVIOUS VIDEO')
                                var InsertVideoResult = InsertNewVideo(InsertVideoData)
                                //response.send(InsertVideoResult)
                            }
                        });


                    } else {
                        console.log('FrontEnd token Id does not match BackEnd Google ID')
                        response.send('Video not Added')
                    }
                }); // END OF: SELECT GOOGLE ID
            } catch (error) {
                console.log('Error from check that token matches profile')
                response.send('Video not Added')
            }
        }
    })

    // ADD ARTICLE
    app.post("/AddArticle", async (request, response) => {
        console.log('Add article route')
        token = request.body.token
        ProfileUserId = request.body.ProfileId
        ArticleLink = request.body.ArticleLink
        ArticleDescription = request.body.ArticleDescription

        VerifiedTokenPayload = await verify(CLIENT_ID, token)
        var FrontEndGoogleUserId = VerifiedTokenPayload[0] //Google user ID
        if (!VerifiedTokenPayload) { //if value == false
            response.send('TOKEN FAIL')
        } else { //Token has been verified
            // Now we ensure that this token corresponds to the ProfileUserId (the user Id seen in the browser url)
            try { // SELECT GOOGLE ID
                pool.query("SELECT google_user_id FROM user_profile WHERE user_id = ?", ProfileUserId, (error, result) => { // value of app user id on row of google user id 
                    StoredGoogleUserID = result[0].google_user_id
                    if (FrontEndGoogleUserId == StoredGoogleUserID) {
                        console.log('Authorised user editing correct profile')
                        InsertData = { user_id: ProfileUserId, content: ArticleLink, content_type: "article", content_desc: ArticleDescription }
                        // ADD ARTICLE LINK TO DATA BASE
                        try { // INSET ARTICLE
                            pool.query('INSERT INTO user_content SET ?', InsertData, (error, result) => {
                                if (result !== null) {
                                    response.send(true)
                                } else {
                                    console.log('Insertion error: ', error)
                                    response.send('Article not Added')
                                }
                            });
                        } catch (error) {
                            console.log('Something went wrong, article not added: ', error)
                            response.send('Article not Added')
                        }
                    } else {
                        console.log('FrontEnd token Id does not match BackEnd Google ID')
                        response.send('Article not Added')
                    }
                }); // END OF: SELECT GOOGLE ID
            } catch (error) {
                console.log('Error from check that token matches profile')
                response.send('Article not Added')
            }
        }
    })

    ///////////////////////////  PODCASTS ///////////////////////////

    // SEARCH PODCASTS //
    // PODCAST SEARCH
    app.post('/SearchPodcasts', async (req, res) => {
        console.log('podcasts route')
        var PodcastSearchTerm = req.body.PodcastSearchTerm
        var PodcastSearchTermAPI = 'https://listen-api.listennotes.com/api/v2/search?q=' + PodcastSearchTerm + '&type=podcast'
        const response = await unirest.get(PodcastSearchTermAPI).header('X-ListenAPI-Key', sourceFile.podcastAPIKey)
        console.log('podcast search = ', response.caseless.dict)
        if (response.status === 429){
            res.send(response.status)
        }
        else if (response.body.results.length === 0) {
            console.log('search fail')
            res.send(false)
        } else  {
            var EmptyShowArrayOutside = {}

            for (i = 0; i < 3; i++) { // show top 3 results
            console.log(response.body.results)

            // console.log(response.body.results[0])
            var thumbnail = response.body.results[i].thumbnail
            var title = response.body.results[i].title_original
            var url = response.body.results[i].listennotes_url
            var id = response.body.results[i].id
            var description = response.body.results[i].description_original
            EmptyShowArrayOutside[i] = { 'thumbnail': thumbnail, 'title': title, 'id': id, 'url': url, 'description': description }

            }
            res.status(200).send(EmptyShowArrayOutside)
        }
    });

    // PODCAST EPISODE SEARCH
    app.post('/SearchPodcastEpisodes', async (req, res) => {
        var PodcastEpisodeSearchTerm = req.body.PodcastEpisodeSearchTerm
        //console.log('episode api: ', PodcastEpisodeSearchTerm)
        var PodcastSearchTermAPI = 'https://listen-api.listennotes.com/api/v2/search?q=' + PodcastEpisodeSearchTerm + '&type=episode'
        const QueryResponse = await unirest.get(PodcastSearchTermAPI).header('X-ListenAPI-Key', sourceFile.podcastAPIKey)
        response = QueryResponse.toJSON()
       
        if (response.statusCode === 429){
            res.send(response.status)
        }
        else if (response.body.results.length === 0) {
            console.log('search fail')
            res.send(false)
        } else {

            console.log('Number of espiodes found: ', response.body.count)
            var EmptyArrayOutside = {}

            for (i = 0; i < response.body.count; i++) {
                
                var thumbnail = response.body.results[i].thumbnail
                var title = response.body.results[i].title_original
                var id = response.body.results[i].id
                EmptyArrayOutside[i] = { 'thumbnail': thumbnail, 'title': title, 'id': id }
            }
            res.status(200).send(EmptyArrayOutside)


        }

    });

    // ADD PODCAST
    app.post("/AddPodcast", async (request, response) => {
        console.log('Add podcast route')
        token = request.body.token
        ProfileUserId = request.body.ProfileId
        PodcastId = request.body.PodcastId

        VerifiedTokenPayload = await verify(CLIENT_ID, token)
        var FrontEndGoogleUserId = VerifiedTokenPayload[0]
        if (!VerifiedTokenPayload) {
            response.send('TOKEN FAIL')
        } else {
            try {
                pool.query("SELECT google_user_id FROM user_profile WHERE user_id = ?", ProfileUserId, (error, result) => { // value of app user id on row of google user id
                    StoredGoogleUserID = result[0].google_user_id
                    if (FrontEndGoogleUserId == StoredGoogleUserID) {
                        InsertData = { user_id: ProfileUserId, content: PodcastId, content_type: "podcast" }
                        try {
                            pool.query('INSERT INTO user_content SET ?', InsertData, (error, result) => {
                                if (result !== null) {
                                    response.send(true)
                                } else {
                                    console.log('Insertion error: ', error)
                                    response.send('Article not Added')
                                }
                            });
                        } catch (error) {
                            console.log('Something went wrong, Podcast not added: ', error)
                            response.send('Podcast not Added')
                        }
                    } else {
                        console.log('FrontEnd token Id does not match BackEnd Google ID')
                        response.send('Podcast not Added')
                    }
                }); // END OF: SELECT GOOGLE ID
            } catch (error) {
                console.log('Error from check that token matches profile')
                response.send('Podcast not Added')
            }
        }
    })

    // ADD PODCAST EPISODE
    app.post("/AddPodcastEpisode", async (request, response) => {
        console.log('Add podcast episode route')
        token = request.body.token
        ProfileUserId = request.body.ProfileId
        PodcastEpisodeID = request.body.PodcastEpisodeID
        console.log('podcast ep to add', PodcastEpisodeID)

        VerifiedTokenPayload = await verify(CLIENT_ID, token)
        var FrontEndGoogleUserId = VerifiedTokenPayload[0]
        if (!VerifiedTokenPayload) {
            response.send('TOKEN FAIL')
        } else {
            try {
                pool.query("SELECT google_user_id FROM user_profile WHERE user_id = ?", ProfileUserId, (error, result) => { // value of app user id on row of google user id
                    StoredGoogleUserID = result[0].google_user_id
                    if (FrontEndGoogleUserId == StoredGoogleUserID) {
                        InsertData = { user_id: ProfileUserId, content: PodcastEpisodeID, content_type: "podcast_episode" }
                        try {
                            pool.query('INSERT INTO user_content SET ?', InsertData, (error, result) => {
                                if (result !== null) {
                                    response.send(true)
                                } else {
                                    console.log('Insertion error: ', error)
                                    response.send('Article not Added')
                                }
                            });
                        } catch (error) {
                            console.log('Something went wrong, Podcast episode not added: ', error)
                            response.send('Podcast episode not Added')
                        }
                    } else {
                        console.log('FrontEnd token Id does not match BackEnd Google ID')
                        response.send('Podcast episode not Added')
                    }
                }); // END OF: SELECT GOOGLE ID
            } catch (error) {
                console.log('Error from check that token matches profile')
                response.send('Podcast episode not Added')
            }
        }
    })





    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// *** POPULATE PROFILE DATA *** ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Videos //
    //////////////////////////////////////////////////////

    // GET VIDEO ROUTE: DESCRIPTION
    // FUNCTION: Populate profile with relevant data
    // 1) Take profile page ID from browser
    // 2) Select data in 'content' corresponding to this profile (user) ID
    // 3) Rather than taking all data, select only the last row, which has the latest entry - this is an unsophisticated way of dealing with > 1 rows for a user (eg if a user submitted multiple videos)
    // 4) Send this data back to the FrontEnd
    app.get("/Videos", (request, response) => {
        //console.log('Video route triggered')
        user_id = request.query.user_id
        // RETRIEVE USER CONTENT DATA
        pool.query("SELECT content_id, content, content_desc FROM user_content WHERE content_type = 'video' AND user_id = ? AND content_desc <= 5;", user_id, (error, result) => {
            if (error) console.log('Content retrieval error:');
            try {
                video_content = result
                //console.log('video query result = ', video_content)
                if (result == null){
                    console.log('Table does not yet exist')
                    response.send(false)
                }
                else if (result.length === 0) {
                    console.log('No video data')
                    response.send(false)
                } else {
                    response.send(video_content)
                }
            } catch (error) {
                console.log("User content error (likely no data for this user)- VIDEOS")
                response.send(false)
            }
        }); // RETRIEVE USER CONTENT DATA: END
    });

    // GET MORE VIDEOS
    app.get("/GetMoreVideos", (request, response) => {
        //console.log('More Video route triggered')
        user_id = request.query.user_id
        // RETRIEVE USER CONTENT DATA
        pool.query("SELECT content_id, content, content_desc FROM user_content WHERE content_type = 'video' AND user_id = ? AND content_desc > 5;", user_id, (error, result) => {
            if (error) console.log('Content retrieval error:');
            try {
                more_video_content = result
                //console.log('video query result = ', video_content)
                if (result == null){
                    console.log('Table does not yet exist')
                    response.send(false)
                }
                else if (result.length === 0) {
                    console.log('No video data')
                    response.send(false)
                } else {
                    response.send(more_video_content)
                }
            } catch (error) {
                console.log("User content error (likely no data for this user)- VIDEOS")
                response.send(false)
            }
        }); // RETRIEVE USER CONTENT DATA: END
    });

    // PODCASTS //
    //////////////////////////////////////////////////////

    // POPULATE PODCASTS (i)
    app.get("/Podcasts", (request, response) => {
        user_id = request.query.user_id
        //console.log('podcast route')

        // RETRIEVE USER CONTENT DATA (ii)
        pool.query("SELECT content_id, content FROM user_content WHERE content_type = 'podcast' AND user_id = ? ", user_id, (error, result) => {
            if (error) console.log('Content retrieval error:', error);
            RetrievedPodcastData = result
            if (result == null){
                console.log('Table does not yet exist')
                response.send(false)
            }
            else if (result.length === 0) {
                //console.log('No podcast data')
                response.send(false)
            } else {
                var PodcastConcatString = "?"
                for (i = 0; i < RetrievedPodcastData.length; i++) {
                    contentId = RetrievedPodcastData[i].content_id
                    PodcastId = RetrievedPodcastData[i].content
                    PodcastConcatString = PodcastConcatString.concat(contentId, "=", PodcastId, "&") //https://stackoverflow.com/a/36123716/6065710
                    PodcastRedirectQuery = "/PodcastAPIQuery" + PodcastConcatString
                }
                response.redirect(PodcastRedirectQuery)

            }
        });
    });
    // POPULATE PODCASTS (iii): SEND STORED IDs TO LISTEN NOTES API TO RETRIEVE DATA
    app.get("/PodcastAPIQuery", async (request, response) => {
        //console.log('api route triggered')
        PodcastAPIQueryId = request.query

        var RetrievedPodastData = {}
        for (var content_id in PodcastAPIQueryId) {
            // console.log('search id = ', content_id)
            if (PodcastAPIQueryId.hasOwnProperty(content_id)) {
                //console.log(content_id + " -> " + PodcastAPIQueryId[content_id]); //https://stackoverflow.com/a/684692/6065710
                var PodcastSearchIDAPI = "https://listen-api.listennotes.com/api/v2/podcasts/" + PodcastAPIQueryId[content_id]
                const response = await unirest.get(PodcastSearchIDAPI).header('X-ListenAPI-Key', sourceFile.podcastAPIKey)
                if (response.status === 429){
                    res.send(response.status)
                }
                console.log('podcast populate quota count = ', response.caseless.dict)

                //console.log('podcast reponse= ', response.toJSON().body.title)
                PodcastTitle = response.toJSON().body.title
                PodcastImage = response.toJSON().body.image
                PodcastWebsite = response.toJSON().body.website

                RetrievedPodastData[content_id] = { title: PodcastTitle, image: PodcastImage, website: PodcastWebsite }
                //console.log(RetrievedPodastData)
            }
        }
        // console.log("*****", RetrievedPodastData)
        response.send(RetrievedPodastData)
    })

    // POPULATE PODCAST EPISODES (i)
    app.get("/PodcastEpisodes", (request, response) => {
        user_id = request.query.user_id
        //console.log('podcast episode route')
        //console.log('podast user id = ', user_id)

        // POPULATE PODCAST EPISODES (ii): RETRIEVE USER CONTENT DATA
        pool.query("SELECT content_id, content, content_desc FROM user_content WHERE (content_type = 'podcast_episode' OR content_type ='podcast_episode_manual') AND user_id = ? ", user_id, (error, result) => {
            if (error) console.log('Content retrieval error:', error);
            RetrievedPodcastEpisodeData = result
            //console.log('episode query result = ', RetrievedPodcastEpisodeData)
            if (result == null){
                console.log('Table does not yet exist')
                response.send(false)
            }
            else if (result.length === 0) {
                //console.log('No podcast data')
                response.send(false)
            } else if (result.content_desc === 'podcast_episode_manual') { // Manually inserted podcasts
                console.log('To Do: write logic for user inserted podcast episodes.')
            } else { // Searched for podcasts
                var PodcastEpisodeConcatString = "?"
                for (i = 0; i < RetrievedPodcastEpisodeData.length; i++) {
                    contentId = RetrievedPodcastEpisodeData[i].content_id
                    PodcastEpisodeId = RetrievedPodcastEpisodeData[i].content
                    PodcastEpisodeConcatString = PodcastEpisodeConcatString.concat(contentId, "=", PodcastEpisodeId, "&") //https://stackoverflow.com/a/36123716/6065710
                    PodcastEpisodeRedirectQuery = "/PodcastEpisodeAPIQuery" + PodcastEpisodeConcatString
                }
                response.redirect(PodcastEpisodeRedirectQuery)

            }
        });
    });

    //POPULATE PODCAST EPISODES (iii): SEND STORED IDs TO LISTEN NOTES API TO RETRIEVE DATA
    app.get("/PodcastEpisodeAPIQuery", async (request, response) => {
        //console.log('Episode api route triggered')

        PodcastEpisodeAPIQueryId = request.query

        var RetrievedPodastEpisodeData = {}
        for (var content_id in PodcastEpisodeAPIQueryId) {
            if (PodcastEpisodeAPIQueryId.hasOwnProperty(content_id)) {
                console.log(content_id + " -> " + PodcastEpisodeAPIQueryId[content_id]); //https://stackoverflow.com/a/684692/6065710
                var PodcastEpisodeSearchIdAPI = "https://listen-api.listennotes.com/api/v2/episodes/" + PodcastEpisodeAPIQueryId[content_id]
                const response = await unirest.get(PodcastEpisodeSearchIdAPI).header('X-ListenAPI-Key', sourceFile.podcastAPIKey)
                if (response.status === 429){
                    res.send(response.status)
                }
                PodcastEpisodeTitle = response.toJSON().body.title
                PodcastEpisodeImage = response.toJSON().body.image
                PodcastEpisodeID = response.toJSON().body.id
                PodcastEpisodeDescription = response.toJSON().body.description
                RetrievedPodastEpisodeData[content_id] = { title: PodcastEpisodeTitle, image: PodcastEpisodeImage, episodeID: PodcastEpisodeID, description: PodcastEpisodeDescription }
            }
        }
        //console.log(RetrievedPodastEpisodeData)
        response.send(RetrievedPodastEpisodeData)
    })

    // ARTICLES //
    //////////////////////////////////////////////////////

    // GET ARTICLE ROUTE: DESCRIPTION
    // FUNCTION: Populate profile with relevant data
    // 1) Take profile page ID from browser
    // 2) Select data in 'content' corresponding to this profile (user) ID
    // 3) Rather than taking all data, select only the last row, which has the latest entry - this is an unsophisticated way of dealing with > 1 rows for a user (eg if a user submitted multiple videos)
    // 4) Send this data back to the FrontEnd
    app.get("/Articles", (request, response) => {
        user_id = request.query.user_id
        // RETRIEVE USER CONTENT DATA
        pool.query("SELECT content_id, content, content_desc FROM user_content WHERE content_type = 'article' AND user_id = ? ", user_id, (error, result) => {
            if (error) console.log('Content retrieval error:', error);
            try {
                RetrievedArticleData = result
                if (result == null){
                    console.log('Table does not yet exist')
                    response.send(false)
                }
                else if (result.length === 0) {
                    console.log('No article data')
                } else {
                    response.send(RetrievedArticleData)
                }
            } catch (error) {
                console.log("User content error (likely no articles data for this user)")
            }
        }); // RETRIEVE USER CONTENT DATA: END
    });

    // RECENT ACTIVITY //
    app.get("/RecentActivity", (request, response) => {
        // RETRIEVE USER CONTENT DATA
        //console.log('recent activity route')
        try{
        pool.query("SELECT full_name, profile_picture, UC.user_id, content_id, content_type, content_desc FROM user_content UC LEFT JOIN user_profile UP ON UC.user_id = UP.user_id ORDER BY content_id DESC LIMIT 20 ", (error, result) => {
            if (error) console.log('Content retrieval error:', error);
            try {
                AllRecentActivity = result
                if (result == null){
                    console.log('Table does not yet exist')
                    response.send(false)
                }
                else if(result.length === 0) {
                    console.log('No recent activity')
                } else {
                    response.send(AllRecentActivity)
                }
            } catch (error) {
                console.log("User content error: ", error)
            }     
        }) // RETRIEVE USER CONTENT DATA: END
    } catch(error){
        console.log("Error likely due to database not existing: ", error)
    }
    });


    //////////////////////////////////////////////////////////////////
    //// *** DISCOVERY *** ////
    //////////////////////////////////////////////////////////////////
    app.get("/DiscoverArticle", (request, response) => {
        user_id = request.query.user_id
        // RETRIEVE USER CONTENT DATA
        pool.query("SELECT content FROM user_content WHERE content_type = 'article' AND user_id = ? ", user_id, (error, result) => {
            if (error) console.log('Content retrieval error:', error);
            try {
                //console.log('article retrieval result = ', result)
                RetrievedArticleData = result
                if (result == null){
                    console.log('Table does not yet exist')
                    response.send(false)
                }
                else if (result.length === 0) {
                    console.log('No article data')
                } else {
                    console.log('sending back to client: ', RetrievedArticleData)
                    response.send(RetrievedArticleData)
                }
            } catch (error) {
                console.log("User content error (likely no data for this user)")
            }
        }); // RETRIEVE USER CONTENT DATA: END
    });



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// *** DELETE PROFILE DATA *** ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    app.delete('/DeleteArticle', async (request, response) => {
        console.log('delete article route')
        console.log('delete request: ', request.query)

        var ContentToDelete = request.query.ContentToDelete
        var token = request.query.token
        var ProfileUserId = request.query.ProfileId

        // VERIFY EDITOR = OWNER
        VerifiedTokenPayload = await verify(CLIENT_ID, token)
        var FrontEndGoogleUserId = VerifiedTokenPayload[0] //Google user ID
        if (!VerifiedTokenPayload) { //if value == false
            response.send('* Token verification FAIL: User not logged in *')
        } else {
            try {
                pool.query("SELECT google_user_id FROM user_profile WHERE user_id = ?", ProfileUserId, (error, result) => { // value of app user id on row of google user id
                    StoredGoogleUserID = result[0].google_user_id
                    if (FrontEndGoogleUserId == StoredGoogleUserID) { // USER IS LOGGED IN & EDITOR = OWNER
                        // DELETE ARTICLE LINK
                        try {
                            pool.query('DELETE FROM user_content WHERE content_id = ?', ContentToDelete, (error, result) => {
                                console.log(result)
                                console.log(error)

                            });
                            response.send(true)
                        } catch (error) {
                            console.log('Something went wrong, article not deleted: ', error)
                            response.send('Article not deleted')
                        }
                    } else {
                        console.log('FrontEnd token Id does not match BackEnd Google ID')
                        response.send('Article not deleted')
                    }
                }); // END OF: SELECT GOOGLE ID
            } catch (error) {
                console.log('Error from check that token matches profile')
                response.send('Article not deleted')
            }
        }
    })


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// *** SIGN OUT *** ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // SIGN OUT ROUTE
    app.get('/SignOut', (req, res) => {
        res.clearCookie('USER_SESSION_TOKEN'); // This works by clearing the cookies from a user's browsers. No cookie = no token = user signed out.
        res.send('CookieDeleted')
        console.log('Cookie deleted')
    })



};
module.exports = router;