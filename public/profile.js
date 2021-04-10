$(document).ready(function () {

    console.log('Profile JS loading...')
    console.log('Server production mode = ', server)

    // DISPLAY OWNER ELEMENTS (FOR EDITING)
    $('.OwnerSwitch').on("change", function () {
        $('.OwnerElement').toggle()
    });


    //GET PAGE VARIABLES
    var urlParams = new URLSearchParams(window.location.search);
    var user_id = urlParams.get('user_id');
    // User ID seen in the browser URL- a user Id is synonymous with profile ID - each user has their own profile 
    var CookieToken = getCookieValue('USER_SESSION_TOKEN')

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



    document.getElementById('banner-name').innerHTML = "<a id='banner-name-text' href=" + server + ">partagr.com</h1>"



    //////////////////////////////////////////////////////////////////
    //// *** EDIT PROFILE *** ////
    //////////////////////////////////////////////////////////////////



    // GET OWNER REQUEST: DESCRIPTION
    // FUNCTION: Check whether viewer is also owner of profile
    // 1) Send GET requst to BacKEnd route Owner with token & profile user id
    // 2) If token is valid and profile user Id matches stored google id, corresponding to token then;
    // 3) Show hidden element with ID = YouTubeForm
    // 4) And insert 'Logged in' text into section with ID tag = 'SessionStatusText'
    // 5) Else, insert 'Unlogged' text into section with ID tag = 'SessionStatusText'

    try {
        $.get(server + '/Owner', {
            token: CookieToken,
            ProfileId: user_id,
        }).done(function (data) {
            console.log('Server response :', data)
            if (data == 'User is profile owner') {
                console.log('Profile owner')

                $('.OwnerSwitch').show() //show edit switch

            } else {
                console.log('not profile owner')
                $('.OwnerSwitch').hide() //hide edit switch

                /*
                document.getElementById('SessionStatusText').innerHTML =
                    "<span style='color: red;'>Unlogged</span>";
                    */
            }
        });
    } catch (err) {
        console.log('Error: ' + err)
    }


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

        // console.log('To post: User id cookie retrieved: ', user_id, 'with article: ', link)
        try { // CLOSE THIS CLAUSE
            $.post(server + '/AddArticle', {
                token: CookieToken,
                ProfileId: user_id,
                ArticleLink: ArticleLink,
                ArticleDescription: ArticleDescription
            }).done(function (data) {
                if (data == true) {
                    window.location.href = window.location.href
                    // refresh page after successfully saving a new video
                } else {
                    alert('Article not added, please try again', data)
                }
            });
        } catch (err) {
            console.log('failed to post to backend')
            console.log('Error: ' + err)
        }
    });

    ///////////////////////////  PODCASTS ///////////////////////////
    //SearchPodcastEpisodes
    // PODCAST SEARCH
    $(document).on("click", "#PodcastSearchButton", function () {
        console.log('Search podcast function executed- ', $(this))

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
                if (data.lenght === 0) {
                    alert('Error- no podcast data available')
                } else {
                    console.log(data)
                    title = data[0]
                    thumbnail = data[1]
                    listenURL = data[2]
                    PodcastID = data[3]
                    console.log('id = ', PodcastID)
                    document.getElementById('podThumbmail').innerHTML +=
                        `<img height="200" width="200" src=${thumbnail}></img>` +
                        `<button class="btn btn-light" id = "AddpodcastButton"> Add Podcast</button>`
                }
            });
        } catch (err) {
            console.log('failed to post to backend')
            console.log('Error: ' + err)
        }
    });

    // ADD PODCAST
    $(document).on('click', '#AddpodcastButton', function () {
        try {
            $.post(server + '/AddPodcast', {
                token: CookieToken,
                ProfileId: user_id,
                PodcastId: PodcastID
            }).done(function (data) {
                if (data == true) {
                    window.location.href = window.location.href
                } else {
                    console.log(data)
                    alert('Podcast not added, please try again', data)
                }
            });
        } catch (err) {
            console.log('failed to post to backend')
            console.log('Error: ' + err)
        }
    });


    //////////////////////////////////////////////////////////////////
    //// *** POPULATE PROFILE DATA *** ////
    //////////////////////////////////////////////////////////////////

    // GET PODCASTS
    var GetPodcastsUrl = server + '/Podcasts?user_id=' + user_id
    console.log('waiting for podcasts to load')

    $.get(GetPodcastsUrl, function (PodcastList, status) {
        $('.PodcastLoader').hide()

        for (var content_id in PodcastList) {
            if (PodcastList.hasOwnProperty(content_id)) {
                document.getElementById('populatePodcasts').innerHTML +=
                    `<a href=${PodcastList[content_id].website} target="_blank"><img class="SavedPodcastThumbnail" src=${PodcastList[content_id].image} alt=${PodcastList[content_id].title}></a>` +
                    `<input type="image" src="DeleteIcon.png" name=${content_id} class="DeleteContentButton OwnerElement"/>`
            }
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
                    `<li><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` +
                    `<input type="image" src="DeleteIcon.png" name=${contentID} class="DeleteContentButton OwnerElement"/>`
            } else if (i >= 5 && i < 10) {
                document.getElementById('populateArticles-row1-col2').innerHTML +=
                    `<li><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` +
                    `<input type="image" src="DeleteIcon.png" name=${contentID} class="DeleteContentButton OwnerElement"/>`
            } else if (i >= 10 && i < 15) {
                document.getElementById('populateArticles-row1-col3').innerHTML +=
                    `<li class=ArticleLinkText><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` +
                    `<input type="image" src="DeleteIcon.png" name=${contentID} class="DeleteContentButton OwnerElement"/>`


            } else if (i > 15 && i <= 20) {
                document.getElementById('populateArticles-row2-col1').innerHTML +=
                    `<li class=ArticleLinkText><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` +
                    `<input type="image" src="DeleteIcon.png" name=${contentID} class="DeleteContentButton OwnerElement"/>`
            } else if (i > 20 && i <= 25) {
                document.getElementById('populateArticles-row2-col2').innerHTML +=
                    `<li class=ArticleLinkText><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` +
                    `<input type="image" src="DeleteIcon.png" name=${contentID} class="DeleteContentButton OwnerElement"/>`
            } else if (i > 25 && i <= 30) {
                document.getElementById('populateArticles-row2-col3').innerHTML +=
                    `<li class=ArticleLinkText><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` +
                    `<input type="image" src="DeleteIcon.png" name=${contentID} class="DeleteContentButton OwnerElement"/>`

            }
        }
    });

    //////////////////////////////////////////////////////////////////
    //// *** DISCOVERY *** ////
    //////////////////////////////////////////////////////////////////

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

    //////////////////////////////////////////////////////////////////
    //// *** DELETE DATA *** ////
    //////////////////////////////////////////////////////////////////

    // ARTICLES

    $(document).on('click', '.DeleteContentButton', function () {

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
                        window.location.href = window.location.href
                    } else {
                        alert('Item not deleted, please try again (error: ', data, ' )')
                    }

                }
            });

            /*
                        $.delete(server + '/DeleteArticle', {
                            token: CookieToken,
                            ProfileId: user_id,
                            DeleteArticleLink: DeleteArticleLink,
                        }).done(function (data) {
                            console.log('Server response :', data)
                            if (data == true) {
                                window.location.href = window.location.href
                                // refresh page after successfully saving a new video
                            } else {
                                alert('Article not deleted, please try again', data)
                            }
                        });
                        */
        } catch (err) {
            console.log('failed to post to backend')
            console.log('Error: ' + err)
        }

    }); // End of document.ready()
});