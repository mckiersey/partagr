
console.log('Homepage javascript running')
console.log('Server production mode = ', server)

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
//Session Status
var cookieToken = getCookieValue('USER_SESSION_TOKEN')
console.log('Session status: cookie token value:', cookieToken)
var SignOutButtonVisibility = document.getElementById("SignOutButton");
if (cookieToken == "") {
    SignOutButtonVisibility.style.display = "none";
    document.getElementById('SessionStatusText').innerHTML = "<span style='color: grey;'>Not Signed in</span>";
} else {
    document.getElementById('SessionStatusText').innerHTML =
        "<span style='color: RGB(170, 204, 0);'>Signed In</span>";
}

//SIGN IN/ SIGN UP: SET COOKIE VALUE IN BROWSER
function onSignIn(googleUser) {
    var id_token = googleUser.getAuthResponse().id_token;
    console.log("Token value to post to BE for validation: ", id_token)
    // POST NEW USER TO BACK END;
    try {
        $.post(server + '/SignIn', {
            token: id_token
        }).done(function (data) {
            console.log('Server response :', data)
            if (data == true) {
                // Automatic direction to profil

                // POST PROFILE ROUTE: DESCRIPTION
                // 1) Take token from cookie in browser
                // 2) Send token to BE
                // 3) If BE verifies token is valid, take user ID and redirect Profile Page
                // Get token from browser
                var CookieToken = getCookieValue('USER_SESSION_TOKEN')
                try {
                    $.post(server + '/ProfileRoute', {
                        token: CookieToken
                    }).done(function (data) {
                        VerificationStatus = data[0]
                        if (VerificationStatus ==
                            '* Token verification SUCCESS: User logged in *') {
                            alert('Verification success')
                            user_id = data[1]
                            // Redirect back to BackEnd to render profile page
                            var BaseProfiledUrl = server + '/ProfilePage?user_id='
                            var ProfileUrl = BaseProfiledUrl + user_id
                            window.location.href = ProfileUrl

                        } else {
                            console.log('Server response :', data)
                            alert('Please sign in')
                            window.location.href = serve + '/'
                        };
                    });
                } catch (err) {
                    console.log('failed to post to backend')
                    response.send('Error: ' + err)
                    window.location.href = server + '/'
                }
            } else {
                alert('Sign in failed. Please try again.')
            }
        }); // onSignIn Error
    } catch (err) {
        console.log('failed to post to backend')
        response.send('Error: ' + err)
    }
}

function signOut() {
    var getUrl = server + `SignOut`
    try {
        $.get(getUrl, {})
            .done(function (data) {
                if (data = 'CookieDeleted') {
                    window.location.href = server + '/'
                } else {
                    alert('Something went wrong, please try to sign out again.')
                }
            });
    } catch (err) {
        console.log('failed to post to backend')
        response.send('Error: ' + err)
    }
}
