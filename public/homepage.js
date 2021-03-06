// GET COOKIE FUNCTION
function getCookieValue(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

//SIGN IN/ SIGN UP: SET COOKIE VALUE IN BROWSER
function onSignIn(googleUser) {
  var id_token = googleUser.getAuthResponse().id_token;
  console.log("Token value to post to BE for validation: ", id_token);
  // POST NEW USER TO BACK END;
  try {
    $.post(server + "/SignIn", {
      token: id_token,
    }).done(function (data) {
      console.log("Sign in: Server response :", data);
      if (data == true) {
        // Automatic direction to profil

        // POST PROFILE ROUTE: DESCRIPTION
        // 1) Take token from cookie in browser
        // 2) Send token to BE
        // 3) If BE verifies token is valid, take user ID and redirect Profile Page
        // Get token from browser
        var CookieToken = getCookieValue("USER_SESSION_TOKEN");
        try {
          $.post("/ProfileRoute", {
            token: CookieToken,
          }).done(function (data) {
            VerificationStatus = data[0];
            if (
              VerificationStatus ==
              "* Token verification SUCCESS: User logged in *"
            ) {
              user_id = data[1];
              // Redirect back to BackEnd to render profile page
              var BaseProfiledUrl = server + "/ProfilePage?user_id=";
              var ProfileUrl = BaseProfiledUrl + user_id;
              window.location.href = ProfileUrl;
            } else {
              console.log("Server response :", data);
              alert("Please sign in");
              window.location.href = serve + "/";
            }
          });
        } catch (err) {
          console.log("failed to post to backend");
          response.send("Error: " + err);
          window.location.href = server + "/";
        }
      } else {
        alert("Sign in failed. Please try again.");
      }
    }); // onSignIn Error
  } catch (err) {
    console.log("failed to post to backend");
    response.send("Error: " + err);
  }
}

function signOut() {
  var getUrl = server + `SignOut`;
  try {
    $.get(getUrl, {}).done(function (data) {
      if ((data = "CookieDeleted")) {
        window.location.href = server + "/";
      } else {
        alert("Something went wrong, please try to sign out again.");
      }
    });
  } catch (err) {
    console.log("failed to post to backend");
    response.send("Error: " + err);
  }
}
// RECENT ACTIVITY
var GetActivity = server + "/RecentActivity";
$.get(GetActivity, function (ActivityList, status) {
  //console.log('recent activity response = ', ActivityList)
  var i;
  for (i = 0; i < ActivityList.length; i++) {
    var content_type = ActivityList[i].content_type;
    var user_name = ActivityList[i].full_name;
    var user_id = ActivityList[i].user_id;
    var content_id = ActivityList[i].content_id;
    var user_photo = ActivityList[i].profile_picture;

    document.getElementById("RecentActivityList").innerHTML +=
      `<tr>` +
      `<td><a href=${server}/ProfilePage?user_id=${user_id}><img class="ActivityProfileImage" height="30" width="30" src="${user_photo}"></a></td>` +
      `<td><a class="RecentActivityText" href=${server}/ProfilePage?user_id=${user_id}#${content_type}><p LinkText id= ${content_id}>${user_name} just added a new ${content_type}</p></a></td>` +
      `</tr>`;
  }
});
