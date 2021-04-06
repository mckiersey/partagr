
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
function MyProfile() {
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
}
//$(document).ready(function () {

console.log('Profile JS loading...')
console.log('Server production mode = ', server)

document.getElementById('banner-name').innerHTML = "<a id='banner-name-text' href=" + server + ">partagr.com</h1>"

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
            /*
            $('.OwnerElement').show() //show edit switch
            document.getElementById('SessionStatusText').innerHTML =
                "<span style='color: RGB(170, 204, 0);'>Logged in</span>";
                */
        } else {
            console.log('not profile owner')
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
function AddArticle() {
    console.log('Add article function executed')
    ArticleLink = document.querySelector('input[name=ArticleLink]').value
    ArticleDescription = document.querySelector('input[name=ArticleDescription]').value

    // console.log('To post: User id cookie retrieved: ', user_id, 'with article: ', link)
    try { // CLOSE THIS CLAUSE
        $.post('http://localhost:80/AddArticle', {
            token: CookieToken,
            ProfileId: user_id,
            ArticleLink: ArticleLink,
            ArticleDescription: ArticleDescription
        }).done(function (data) {
            console.log('Server response :', data)
            if (data == true) {
                window.location.href = window.location.href
                // refresh page after successfully saving a new video
            } else {
                alert('Video not added, please try again', data)
            }
        });
    } catch (err) {
        console.log('failed to post to backend')
        console.log('Error: ' + err)
    }
}



//////////////////////////////////////////////////////////////////
//// *** POPULATE PROFILE DATA *** ////
//////////////////////////////////////////////////////////////////
// GET ARTICLES REQUEST: DESCRIPTION
//$(document).ready(function () {

var GetArticleUrl = server + '/Articles?user_id=' + user_id
$.get(GetArticleUrl, function (ArticleList, status) {
    var i;
    for (i = 1; i < ArticleList.length; i++) {

        var caption = ArticleList[i].content_desc
        var articleLink = ArticleList[i].content


        var pathArray = articleLink.split('/');
        var protocol = pathArray[0];
        var host = pathArray[2];
        var baseUrl = protocol + '//' + host;
        if (i <= 4) {
            document.getElementById('populateArticles-row1-col1').innerHTML +=
                `<li class=ArticleLinkText><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` +
                `<input type="image" src= type='submit' class="btTxt submit" id="DeleteArticleButton" />`

        } else if (i >= 4 && i < 9) {
            document.getElementById('populateArticles-row1-col2').innerHTML +=
                `<li><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` +
                `<input type="image" src="DeleteIcon.png" name=${articleLink}  class="btTxt submit" id="DeleteArticleButton" />`
        } else if (i >= 9 && i < 13) {
            document.getElementById('populateArticles-row1-col3').innerHTML +=
                `<li class=ArticleLinkText><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` + `<input type="image" src="DeleteIcon.png" name=${articleLink}  class="btTxt submit" id="DeleteArticleButton" />`


        } else if (i > 15 && i <= 20) {
            document.getElementById('populateArticles-row2-col1').innerHTML +=
                `<li class=ArticleLinkText><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` +

                `<input type="image" src="DeleteIcon.png" name=${articleLink}  class="btTxt submit" id="DeleteArticleButton" />`
        } else if (i > 20 && i <= 25) {
            document.getElementById('populateArticles-row2-col2').innerHTML +=
                `<li class=ArticleLinkText><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` +
                `<input type="image" src="DeleteIcon.png" name="${articleLink}"  class="btTxt submit" id="DeleteArticleButton" />`
        } else if (i > 25 && i <= 30) {
            document.getElementById('populateArticles-row2-col3').innerHTML +=
                `<li class=ArticleLinkText><img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=ArticleLinkText href =${articleLink} target="_blank">  ${caption}</a></li>` +
                `<input type="image" src="DeleteIcon.png" name=${articleLink}  class="btTxt submit" id="DeleteArticleButton" />`

        }
    }
});

//////////////////////////////////////////////////////////////////
//// *** DELETE DATA *** ////
//////////////////////////////////////////////////////////////////

// ARTICLES

$('#DeleteArticleButtonStyled').on('click', function () {
    console.log('article delete button clicked')
    alert('button clicked!')
});
$('#DeleteArticleButtonInput').on('click', function () {
    console.log('article delete button clicked')
    alert('button clicked!')
});
$('#DeleteArticleButtonButton').on('click', function () {
    console.log('article delete button clicked')
    alert('button clicked!')
});
//}); // End of document.ready()