$(document).ready(function () {

    // DISPLAY OWNER ELEMENTS (FOR EDITING)
    $('.OwnerSwitch').on("change", function () {
        $('.OwnerElement').toggle()
    });


    //GET PAGE VARIABLES
    var urlParams = new URLSearchParams(window.location.search);
    var user_id = urlParams.get('user_id');
    // User ID seen in the browser URL- a user Id is synonymous with profile ID - each user has their own profile 

    // GET COOKIE FUNCTION
    function getCookieValue(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    // MY PROFILE FUNCTION
    $(document).on('click', '#MyProfile', function () {
        var CookieToken = getCookieValue('USER_SESSION_TOKEN')

        console.log('my profile click')
        console.log(server + '/MyProfile')
        try {
            $.post(server + '/MyProfile', {
                token: CookieToken
            }).done(function (data) {
                logged_in_user_id = data[0]
                // Redirect back to BackEnd to render profile page
                var BaseProfiledUrl = server + '/ProfilePage?user_id='
                var ProfileUrl = BaseProfiledUrl + data
                window.location.href = ProfileUrl
            });
        } catch (err) {
            console.log('failed to post to backend:', err)
        }
    });


    // RETURN TO HOME PAGE
    document.getElementById('banner-name').innerHTML = "<a id='banner-name-text' href=" + server + ">partagr.com</h1>"
    $(document).on('click', '#SignInButton', function () {
        window.location.href = server
    });

    // REMOVE RECENT ACTIVITY FOR PHONES

    $(window).resize(function () {
        var windowsize = $(window).width();
        if (windowsize < 1000) {
            $(".RecentlyAdded").hide()
        } else {
            $(".RecentlyAdded").show()
        }
    });









    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// *** EDIT PROFILE *** ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    // GET OWNER REQUEST: DESCRIPTION
    // FUNCTION: Check whether viewer is also owner of profile
    // 1) Send GET requst to BacKEnd route Owner with token & profile user id
    // 2) If token is valid and profile user Id matches stored google id, corresponding to token then;
    // 3) Show hidden element with ID = YouTubeForm
    // 4) And insert 'Logged in' text into section with ID tag = 'SessionStatusText'
    // 5) Else, insert 'Unlogged' text into section with ID tag = 'SessionStatusText'

    try {
        var CookieToken = getCookieValue('USER_SESSION_TOKEN')
        $.get(server + '/Owner', {
            token: CookieToken,
            ProfileId: user_id,
        }).done(function (data) {
            console.log('Server response :', data)
            if (data == 'User is profile owner') {
                $('.OwnerSwitch').show() //show edit switch
                $('.SignInButton').hide()
            } else {
                console.log('not profile owner')
                $('.OwnerSwitch').hide() //hide edit switch
                $('.SignInButton').show()

                /*
                document.getElementById('SessionStatusText').innerHTML =
                    "<span style='color: red;'>Unlogged</span>";
                    */
            }
        });
    } catch (err) {
        console.log('Error: ' + err)
    }

    ///////////////////////////  YOUTUBE ///////////////////////////
    $(document).on('click', '.AddYouTubeVideo', function (event) {
        var CookieToken = getCookieValue('USER_SESSION_TOKEN')
        VideoPosition = event.target.id
        VideoPositionInteger = VideoPosition.match(/\d+/)[0] //get integer from string
        InputName = "YouTubeLink" + VideoPositionInteger
        VideoInput = document.querySelector(`input[name=${InputName}]`).value
        if (VideoInput.includes("youtube")) {
            var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            var match = VideoInput.match(regExp);
            if (match && match[2].length == 11) {
                VideoID = match[2];
                console.log('Video ID = ', VideoID)
                try {
                    $.post(server + '/AddYouTubeVideo', {
                        token: CookieToken,
                        ProfileId: user_id,
                        VideoID: VideoID,
                        Position: VideoPositionInteger
                    }).done(function (data) {
                        console.log('length of response = ', data.length)
                        console.log(' add video response data: ', data)
                        if (data == true) {
                            window.location.href = server + "/ProfilePage?user_id=" + user_id
                        } else if (data == "TOKEN FAIL") {
                            alert("Log in expired- please sign in again")
                            window.location.href = server + "/ProfilePage?user_id=" + user_id

                        } else {
                            alert('Video not added, please try again')
                            window.location.href = server + "/ProfilePage?user_id=" + user_id
                        }
                    })
                } catch (err) {
                    console.log('failed to post to backend')
                    console.log('Error: ' + err)
                }
            } else {
                console.log(match)
                alert('Error: Something went wrong - please ensure the link is from YouTube')
            }
        } else {
            alert('Please enter a link from YouTube')
        }
    });

    // POST ADD ARTICLE REQUEST: DESCRIPTION
    // FUNCTION: Allow proflie owner to add content to her own profile (and not someone else's)
    // 1) Retrieve data submitted by user in a form
    // 2) Send CookieToken, user profile id and submitted link to BackEnd route Add ...
    // 3) If token is valid and profile user Id matches stored google id, corresponding to token then;
    // 4) Set the page 'location' = to the page 'location' => refresh the page. This automatic refresh upon success will then load the newly added video via the Video request, above
    // 5) Else, send Alert
    $(document).on('click', '#PostArticleButton', function () {
        ArticleLink = document.querySelector('input[name=ArticleLink]').value
        ArticleDescription = document.querySelector('input[name=ArticleDescription]').value
        var CookieToken = getCookieValue('USER_SESSION_TOKEN')

        // console.log('To post: User id cookie retrieved: ', user_id, 'with article: ', link)
        try { // CLOSE THIS CLAUSE
            $.post(server + '/AddArticle', {
                token: CookieToken,
                ProfileId: user_id,
                ArticleLink: ArticleLink,
                ArticleDescription: ArticleDescription
            }).done(function (data) {
                if (data == true) {
                    window.location.href = server + "/ProfilePage?user_id=" + user_id
                } else if (data == "TOKEN FAIL") {
                    alert("Log in expried- please sign in again")
                    window.location.href = server + "/ProfilePage?user_id=" + user_id

                } else {
                    console.log(data)
                    alert('Link not added, please try again')
                    window.location.href = server + "/ProfilePage?user_id=" + user_id
                }
            });
        } catch (err) {
            console.log('failed to post to backend')
            console.log('Error: ' + err)
        }
    });

    ///////////////////////////  PODCASTS ///////////////////////////

    // PODCAST SEARCH
    $(document).on("click", "#PodcastSearchButton", function () {
        var CookieToken = getCookieValue('USER_SESSION_TOKEN')
        console.log('Search podcast function executed- ', $(this))
        $('.PodcastSearchResultsSection').show()
        PodcastSearchTerm = $("#PodcastSearchText").val() //[0].value; // Retrieve submitted data
        console.log('search term = ', PodcastSearchTerm)
        PodcastSearchTermQueryFormat = PodcastSearchTerm.replaceAll(" ", "%20")
        console.log('To search: podcast name = ', PodcastSearchTermQueryFormat)

        try {
            $.post(server + '/SearchPodcasts', {
                token: CookieToken,
                ProfileId: user_id,
                PodcastSearchTerm: PodcastSearchTermQueryFormat
            }).done(function (data) {
                console.log('Server response :', data)
                if (data == false) {
                    console.log('search fail')
                    alert('No podcast found- try another search term')
                } else {
                    console.log(data)
                    title = data[0]
                    thumbnail = data[1]
                    listenURL = data[2]
                    PodcastID = data[3]
                    description = data[4]
                    console.log('description = ', description)
                    document.getElementById('PodcastSearchResultThumbnail_1').innerHTML +=
                        `<h3> Add <emph> podcast</emph></h3>` +
                        `<img height = "200" width = "200" src = ${thumbnail}></img>` +
                        `<button class="btn btn-light AddpodcastButton" id= ${PodcastID}> Add Podcast</button>`
                    document.getElementById('PodcastDescription').innerHTML += `<p> ${description}</p>`

                }
            });
        } catch (err) {
            console.log('failed to post to backend')
            console.log('Error: ' + err)
        }
    });

    // PODCAST EPISODE SEARCH
    $(document).on("click", "#PodcastEpisodeSearchButton", function () {
        var CookieToken = getCookieValue('USER_SESSION_TOKEN')
        $('.PodcastSearchResultsSection').show()
        PodcastEpisodeSearchTerm = $("#PodcastEpisodeSearchText").val() //[0].value; // Retrieve submitted data
        PodcastEpisodeSearchTermQueryFormat = PodcastEpisodeSearchTerm.replaceAll(" ", "%20")
        try {
            $.post(server + '/SearchPodcastEpisodes', {
                token: CookieToken,
                ProfileId: user_id,
                PodcastEpisodeSearchTerm: PodcastEpisodeSearchTermQueryFormat
            }).done(function (data) {
                console.log('Server response :', data)
                if (data == false) {
                    alert('No episode found- try another search term')
                    $('.ManualPodcastInput').show()

                } else {

                    for (var result_number in data) {
                        title = data[result_number].title
                        thumbnail = data[result_number].thumbnail
                        PodcastEpisodeID = data[result_number].id
                        if (result_number <= 1) {
                            document.getElementById('PodcastSearchResultThumbnail_1').innerHTML +=
                                `<div class="row">` +
                                `<div class = "col">` +
                                `<img height="60" width="60" class="PodcastEpisodeSearchThumbnail" src=${thumbnail} />` +
                                `<p class="EpisodeSearchTitle">${title}</p>` +
                                `<button class="btn btn-light AddpodcastEpisodeButton" id= ${PodcastEpisodeID}> Add Episode</button>` +
                                `</div></div>`

                        } else if (result_number > 1 && result_number <= 3) {
                            document.getElementById('PodcastSearchResultThumbnail_2').innerHTML +=
                                `<div class="row">` +
                                `<div class = "col-12">` +
                                `<img height="60" width="60" class="PodcastEpisodeSearchThumbnail" src=${thumbnail} />` +
                                `<p class="EpisodeSearchTitle">${title}</p>` +
                                `</div></div>` +
                                `<div class="row">` +
                                `<div class = "col-12">` +
                                `<button class="btn btn-light AddpodcastEpisodeButton" id= ${PodcastEpisodeID}> Add Episode</button>` +
                                `</div></div>`
                        } else if (result_number > 3 && result_number <= 5) {
                            document.getElementById('PodcastSearchResultThumbnail_3').innerHTML +=
                                `<div class="row">` +
                                `<div class = "col-12">` +
                                `<img height="60" width="60" class="PodcastEpisodeSearchThumbnail" src=${thumbnail} />` +
                                `<p class="EpisodeSearchTitle">${title}</p>` +
                                `</div></div>` +
                                `<div class="row">` +
                                `<div class = "col-12">` +
                                `<button class="btn btn-light AddpodcastEpisodeButton" id= ${PodcastEpisodeID}> Add Episode</button>` +
                                `</div></div>`

                        } else if (result_number > 5 && result_number <= 7) {
                            document.getElementById('PodcastSearchResultThumbnail_4').innerHTML +=
                                `<div class="row">` +
                                `<div class = "col-12">` +
                                `<img height="60" width="60" class="PodcastEpisodeSearchThumbnail" src=${thumbnail} />` +
                                `<p class="EpisodeSearchTitle">${title}</p>` +
                                `</div></div>` +
                                `<div class="row">` +
                                `<div class = "col-12">` +
                                `<button class="btn btn-light AddpodcastEpisodeButton" id= ${PodcastEpisodeID}> Add Episode</button>` +
                                `</div></div>`

                        } else if (result_number > 7 && result_number <= 9) {
                            document.getElementById('PodcastSearchResultThumbnail_5').innerHTML +=
                                `<div class="row">` +
                                `<div class = "col-12">` +
                                `<img height="60" width="60" class="PodcastEpisodeSearchThumbnail" src=${thumbnail} />` +
                                `<p class="EpisodeSearchTitle">${title}</p>` +
                                `</div></div>` +
                                `<div class="row">` +
                                `<div class = "col-12">` +
                                `<button class="btn btn-light AddpodcastEpisodeButton" id= ${PodcastEpisodeID}> Add Episode</button>` +
                                `</div></div>`
                        }
                        $('.ManualPodcastInput').show()
                    }
                }
            });
        } catch (err) {
            console.log('failed to post to backend')
            console.log('Error: ' + err)
        }


    });



    // ADD PODCAST
    $(document).on('click', '.AddpodcastButton', function () {
        PodcastToAdd = this.id
        var CookieToken = getCookieValue('USER_SESSION_TOKEN')

        try {
            $.post(server + '/AddPodcast', {
                token: CookieToken,
                ProfileId: user_id,
                PodcastId: PodcastToAdd
            }).done(function (data) {
                if (data == true) {
                    window.location.href = server + "/ProfilePage?user_id=" + user_id
                } else if (data == "TOKEN FAIL") {
                    alert("Log in expried- please sign in again")
                    window.location.href = server + "/ProfilePage?user_id=" + user_id

                } else {
                    console.log(data)
                    alert('Podcast not added, please try again')
                    window.location.href = server + "/ProfilePage?user_id=" + user_id
                }
            });
        } catch (err) {
            console.log('failed to post to backend')
            console.log('Error: ' + err)
        }
    });

    // ADD PODCAST EPISODE 
    $(document).on('click', '.AddpodcastEpisodeButton', function () {
        alert('adding episode')
        var CookieToken = getCookieValue('USER_SESSION_TOKEN')
        PodcastEpisodeToAdd = this.id
        try {
            $.post(server + '/AddPodcastEpisode', {
                token: CookieToken,
                ProfileId: user_id,
                PodcastEpisodeID: PodcastEpisodeToAdd
            }).done(function (data) {
                if (data == true) {
                    window.location.href = server + "/ProfilePage?user_id=" + user_id
                } else if (data == "TOKEN FAIL") {
                    alert("Log in expried- please sign in again")
                    window.location.href = server + "/ProfilePage?user_id=" + user_id

                } else {
                    console.log(data)
                    alert('Podcast Episode not added, please try again')
                    window.location.href = server + "/ProfilePage?user_id=" + user_id
                }
            });
        } catch (err) {
            console.log('failed to post to backend')
            console.log('Error: ' + err)
        }
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// *** POPULATE PROFILE DATA *** ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // GET VIDEOS
    var GetVideoUrl = server + '/Videos?user_id=' + user_id
    $.get(GetVideoUrl, function (VideoList, status) {
        if (VideoList == false) {
            $(".VideosLoader").hide()
            document.getElementById('VideoPosition1').innerHTML += "<h3>No videos found.</h3>"
        } else {
            var VideoCounter;
            for (VideoCounter = 0; VideoCounter < VideoList.length; VideoCounter++) {
                var VideoPositionInteger = VideoList[VideoCounter].content_desc
                var VideoID = VideoList[VideoCounter].content
                var ContentID = VideoList[VideoCounter].content_id
                VideoElementID = "VideoPosition" + VideoPositionInteger
                //console.log('value of VideoCounter = ', VideoCounter)
                console.log('video id', VideoID)
                if (VideoPositionInteger == 1) {
                    document.getElementById(VideoElementID).innerHTML +=
                        `<iframe id="iFrame${VideoPositionInteger}" width="900" height="450" src="https://www.youtube.com/embed/${VideoID}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` +
                        `<input type = "image" src = "DeleteIcon.png" name = ${ContentID} class="DeleteContentButton OwnerElement"/>`

                } else {
                    document.getElementById(VideoElementID).innerHTML +=
                        `<iframe id="iFrame${VideoPositionInteger}" width="560" height="315" src="https://www.youtube.com/embed/${VideoID}" title="YouTube video player" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` +
                        `<input type = "image" src = "DeleteIcon.png" name = ${ContentID} class="DeleteContentButton OwnerElement"/>`
                }
            }
            document.getElementById("iFrame" + VideoPositionInteger).onload = function () {
                $(".VideosLoader").slideUp("fast")
            };
        }
    });

    // GET MORE VIDEOS
    var MoreVideoClickCounter = 0
    $(document).on('click', '.GetMoreVideos', function () {
        console.log('more video click counter:', MoreVideoClickCounter)
        if (MoreVideoClickCounter == 0) {
            console.log('/!\ getting more videos!')
            var GetMoreVideosUrl = server + '/GetMoreVideos?user_id=' + user_id
            $.get(GetMoreVideosUrl, function (MoreVideosList, status) {
                if (MoreVideosList == false) {
                    $(".MoreVideosLoader").hide()
                } else {
                    var MoreVideosCounter;
                    var NumberVideosToLoad = MoreVideosList.length
                    for (MoreVideosCounter = 0; MoreVideosCounter < NumberVideosToLoad; MoreVideosCounter++) {
                        var VideoPositionInteger = MoreVideosList[MoreVideosCounter].content_desc
                        var VideoID = MoreVideosList[MoreVideosCounter].content
                        var ContentID = MoreVideosList[MoreVideosCounter].content_id
                        VideoElementID = "VideoPosition" + VideoPositionInteger
                        console.log('value of MoreVideoCounter = ', MoreVideosCounter)
                        console.log('video id', VideoID)
                        document.getElementById(VideoElementID).innerHTML +=
                            `<iframe id="iFrame${VideoPositionInteger}" width="560" height="315" src="https://www.youtube.com/embed/${VideoID}" title="YouTube video player" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` +
                            `<input type = "image" src = "DeleteIcon.png" name = ${ContentID} class="DeleteContentButton OwnerElement"/>`
                    }
                    document.getElementById("iFrame" + VideoPositionInteger).onload = function () {
                        $(".MoreVideosLoader").slideUp("fast")
                    };
                }
            });
            $('.ShowMore').slideDown("slow");
            $('#ShowMore').slideUp()
            $('#ShowLess').show()
        } else {

            $('.ShowMore').slideDown("slow");
            $('#ShowMore').slideUp()
            $('#ShowLess').show()
        }
        MoreVideoClickCounter++

    });

    // SHOW MORE VIDEOS

    $("#ShowLess").click(function () {
        $('.ShowMore').slideUp("fast");
        $('#ShowLess').hide()
        $('#ShowMore').show()
    });

    // GET PODCASTS
    var GetPodcastsUrl = server + '/Podcasts?user_id=' + user_id
    //console.log('Loading podcasts...')

    $.get(GetPodcastsUrl, function (PodcastList, status) {
        $('.PodcastLoader').hide()
        if (PodcastList == false) {
            document.getElementById('PopulatePodcasts').innerHTML += "<h3 class='PodcastInstructions'>Use <b>Edit Mode</b> to search podcasts</h3>"
        }
        for (var content_id in PodcastList) {
            if (PodcastList.hasOwnProperty(content_id)) {
                document.getElementById('PopulatePodcasts').innerHTML +=
                    `<a href = ${PodcastList[content_id].website} target = "_blank" > <img class="SavedPodcastThumbnail" src=${PodcastList[content_id].image} alt=${PodcastList[content_id].title}></a>` +
                    `<input type = "image" src = "DeleteIcon.png" name = ${content_id} class="DeleteContentButton OwnerElement"/>`
            }
        }
    });

    // GET PODCAST EPISODES
    var GetPodcastEpisodesUrl = server + '/PodcastEpisodes?user_id=' + user_id
    //console.log('Loading podcast episodes...')

    $.get(GetPodcastEpisodesUrl, function (PodcastEpisodeList, status) {

        $('.PodcastEpisodeLoader').hide()
        if (PodcastEpisodeList == false) {
            document.getElementById('PopulatePodcastEpisodes').innerHTML += "<h3 class='PodcastInstructions'>Use <b>Edit Mode</b> to search podcast episodes</h3>"
        }
        for (var content_id in PodcastEpisodeList) {
            desc = PodcastEpisodeList[content_id].description
            firstParagraph = desc.substr(0, desc.indexOf('</p>'));
            if (PodcastEpisodeList.hasOwnProperty(content_id)) {
                document.getElementById('podcast-episode-table').innerHTML += `<tr>`
                    + `<td rowspan ="2"> <input type="image" name=${PodcastEpisodeList[content_id].episodeID} class="SavedPodcastEpisodeThumbnail ClickToPlay" src=${PodcastEpisodeList[content_id].image}></td>`
                    + `<td class="PodcastEpisodeTitle ClickToPlay"> ${PodcastEpisodeList[content_id].title}</td>`
                    + `<td> <input class="PodcastPlayButton ClickToPlay" type="image" name=${PodcastEpisodeList[content_id].episodeID} src="PlayButton.png"></td>`
                    + `</tr>`
                    + `<tr>`
                    + `<td> ${firstParagraph}</td>`
                    + `<td> <input type="image" src="DeleteIcon.png" name=${content_id} class="DeleteContentButton OwnerElement"/></td>`
                    + `</tr>`
            }
        }
    });


    // CLICK TO PLAY PODCAST EPISODE
    $(document).on('click', '.ClickToPlay', function () {
        EpisodeToPlay = $(this).attr('name')
        console.log('to play = ', EpisodeToPlay)
        if ($('#PodcastPlayerFrame').length)  //Replace an existant player with a new one
        {
            $('#PodcastPlayerFrame').remove();
            document.getElementById('PodcastPlayer').innerHTML +=
                `<iframe id=PodcastPlayerFrame src = "https://www.listennotes.com/embedded/e/${EpisodeToPlay}/" height = "300px" width = "100%" style = "width: 1px; min-width: 100%;" frameborder = "0" scrolling = "no" loading = "lazy"></iframe>`
        } else {
            document.getElementById('PodcastPlayer').innerHTML +=
                `<iframe id=PodcastPlayerFrame src = "https://www.listennotes.com/embedded/e/${EpisodeToPlay}/" height = "300px" width = "100%" style = "width: 1px; min-width: 100%;" frameborder = "0" scrolling = "no" loading = "lazy"></iframe>`
        }
    });


    // GET ARTICLES 
    var GetArticleUrl = server + '/Articles?user_id=' + user_id
    $.get(GetArticleUrl, function (ArticleList, status) {
        var i;
        for (i = 0; i < ArticleList.length; i++) {

            var caption = ArticleList[i].content_desc
            var articleLink = ArticleList[i].content
            var contentID = ArticleList[i].content_id

            var pathArray = articleLink.split('/');
            var protocol = pathArray[0];
            var host = pathArray[2];
            var baseUrl = protocol + '//' + host;
            if (i < 5) {
                document.getElementById('populateArticles-row1-col1').innerHTML +=
                    `<li> <img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=LinkText href=${articleLink} target="_blank">  ${caption}</a></li>` +
                    `<input type = "image" src = "DeleteIcon.png" name = ${contentID} class="DeleteContentButton OwnerElement"/>`
            } else if (i >= 5 && i < 10) {
                document.getElementById('populateArticles-row1-col2').innerHTML +=
                    `<li> <img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=LinkText href=${articleLink} target="_blank">  ${caption}</a></li > ` +
                    `<input type = "image" src = "DeleteIcon.png" name = ${contentID} class="DeleteContentButton OwnerElement"/>`
            } else if (i >= 10 && i < 15) {
                document.getElementById('populateArticles-row1-col3').innerHTML +=
                    `<li class=LinkText > <img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=LinkText href=${articleLink} target="_blank">  ${caption}</a></li>` +
                    `<input type = "image" src = "DeleteIcon.png" name = ${contentID} class="DeleteContentButton OwnerElement"/>`


            } else if (i > 15 && i <= 20) {
                document.getElementById('populateArticles-row2-col1').innerHTML +=
                    `<li class=LinkText > <img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=LinkText href=${articleLink} target="_blank">  ${caption}</a></li>` +
                    `<input type = "image" src = "DeleteIcon.png" name = ${contentID} class="DeleteContentButton OwnerElement"/>`
            } else if (i > 20 && i <= 25) {
                document.getElementById('populateArticles-row2-col2').innerHTML +=
                    `<li class=LinkText > <img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=LinkText href=${articleLink} target="_blank">  ${caption}</a></li>` +
                    `<input type = "image" src = "DeleteIcon.png" name = ${contentID} class="DeleteContentButton OwnerElement"/> `
            } else if (i > 25 && i <= 30) {
                document.getElementById('populateArticles-row2-col3').innerHTML +=
                    `<li class=LinkText > <img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=LinkText href=${articleLink} target="_blank">  ${caption}</a></li>` +
                    `<input type = "image" src = "DeleteIcon.png" name = ${contentID} class="DeleteContentButton OwnerElement"/> `

            }
        }
    });

    // RECENT ACTIVITY
    var GetActivity = server + '/RecentActivity'
    $.get(GetActivity, function (ActivityList, status) {
        //console.log('recent activity response = ', ActivityList)
        var i;
        for (i = 0; i < ActivityList.length; i++) {

            var content_type = ActivityList[i].content_type
            var user_name = ActivityList[i].full_name
            var user_id = ActivityList[i].user_id
            var content_id = ActivityList[i].content_id
            var user_photo = ActivityList[i].profile_picture

            document.getElementById('RecentActivityList').innerHTML += `<tr>`
                + `<td><a href=${server}/ProfilePage?user_id=${user_id}><img class="ActivityProfileImage" height="50" width="50" src="${user_photo}"></a></td>`
                + `<td><a class="RecentActivityText" href=${server}/ProfilePage?user_id=${user_id}#${content_type}><p LinkText id= ${content_id}>${user_name} just added a new ${content_type}</p></a></td>`
                + `</tr>`
        }
    })

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// *** DISCOVERY *** ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // DISCOVER ARTICLE
    $(document).on('click', '#ArticleDiscovery', function () {
        DiscoverArticleUrl = server + '/DiscoverArticle?user_id=' + user_id
        $.get(DiscoverArticleUrl, function (UsersArticles, status) {
            RandomArticlePosition = Math.floor(Math.random() * UsersArticles.length);
            DisoveryArticle = UsersArticles[RandomArticlePosition].content
            window.open(DisoveryArticle, '_blank' // <- This is what makes it open in a new window.
            );
        });

    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //// *** DELETE DATA *** ////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    $(document).on('click', '.DeleteContentButton', function () {
        var CookieToken = getCookieValue('USER_SESSION_TOKEN')

        console.log('DELETE CLICKED')
        ContentToDelete = $(this).attr('name')
        var requestString = server + '/DeleteArticle'

        try {
            $.ajax({
                url: requestString + '?' + $.param({
                    "ContentToDelete": ContentToDelete,
                    "token": CookieToken,
                    "ProfileId": user_id
                }),
                type: 'DELETE',
                success: function (result) {
                    console.log('delete request = ', result)
                    if (result = true) {
                        console.log('item deleted')
                        window.location.href = server + "/ProfilePage?user_id=" + user_id
                    } else {
                        alert('Item not deleted, please try again (error: ', data, ' )')
                    }

                }
            });

        } catch (err) {
            console.log('failed to post to backend')
            console.log('Error: ' + err)
        }

    }); // End of document.ready()
});