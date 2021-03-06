$(document).ready(function () {
  // DISPLAY OWNER ELEMENTS (FOR EDITING)
  $(".OwnerSwitch").on("change", function () {
    $(".OwnerElement").toggle();
    if (!$(this).is(":checked")) {
      switchStatus = $(this).is(":checked");
      window.location.href = server + "/ProfilePage?user_id=" + user_id;
    }
  });

  //GET PAGE VARIABLES
  var urlParams = new URLSearchParams(window.location.search);
  var user_id = urlParams.get("user_id");
  // User ID seen in the browser URL- a user Id is synonymous with profile ID - each user has their own profile

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

  $(document).on("click", "#LoggedInProfilePicture", function () {
    var CookieToken = getCookieValue("USER_SESSION_TOKEN");

    console.log(server + "/MyProfile");
    try {
      $.post(server + "/MyProfile", {
        token: CookieToken,
      }).done(function (data) {
        console.log("my profile data response:", data);
        logged_in_user_id = data[0];
        // Redirect back to BackEnd to render profile page
        var BaseProfiledUrl = server + "/ProfilePage?user_id=";
        var ProfileUrl = BaseProfiledUrl + data;
        window.location.href = ProfileUrl;
      });
    } catch (err) {
      console.log("failed to post to backend:", err);
    }
  });

  // Click Partagr to return
  $(document).on("click", "#banner-name-text", function () {
    window.location.href = server + "/";
  });

  // RETURN TO HOME PAGE
  $(document).on("click", "#SignInButton", function () {
    window.location.href = server + "/";
  });

  // REMOVE RECENT ACTIVITY FOR PHONES

  $(window).resize(function () {
    var windowsize = $(window).width();
    if (windowsize < 1000) {
      $(".RecentlyAdded").hide();
    } else {
      $(".RecentlyAdded").show();
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
    var CookieToken = getCookieValue("USER_SESSION_TOKEN");
    $.get(server + "/Owner", {
      token: CookieToken,
      ProfileId: user_id,
    }).done(function (data) {
      //console.log("Server response :", data);
      if (data == "User is profile owner") {
        console.log("Logged in profile owner");
        $(".OwnerPermissionSection").show(); //show edit switch
        $(".SignInButton").hide();
      } else if (data == "User is logged in, but user is not profile owner") {
        $(".OwnerPermissionSection").hide(); //hide edit switch
        $(".SignInButton").hide();
      } else {
        $(".OwnerPermissionSection").hide(); //hide edit switch
        $(".SignInButton").show();
      }
    });
  } catch (err) {
    console.log("Error: " + err);
  }

  // GET PROFILE PAGE PROFILE PHOTO
  try {
    $.get(server + "/ProfilePagePhoto", {
      ProfileId: user_id,
    }).done(function (data) {
      OwnerProfilePicture = data;
      document.getElementById(
        "OwnerProfilePicture"
      ).innerHTML += `<img id="OwnerProfilePictureImage" class="float-right" src=${OwnerProfilePicture} referrerpolicy="no-referrer">`;
    });
  } catch (err) {
    console.log("Error: " + err);
  }

  // GET LOGGED IN USER PHOTO REQUEST
  try {
    var CookieToken = getCookieValue("USER_SESSION_TOKEN");
    $.get(server + "/LoggedUserProfilePhoto", {
      token: CookieToken,
    }).done(function (data) {
      console.log(
        "Server response (logged profile picture) :",
        data[0].profile_picture
      );
      var GenericProfilePhotos = [
        "DefaultProfilePictureGirl.jpeg",
        "DefaultProfilePictureBeardGuy.jpeg",
      ];
      var GenericProfilePhoto =
        GenericProfilePhotos[
          Math.floor(Math.random() * GenericProfilePhotos.length)
        ]; //random selection of male or female avatar.
      console.log("random: ", GenericProfilePhoto);
      if (data == false) {
        console.log("No profile picture for logged in user");
        document.getElementById(
          "LoggedInProfilePictureSpace"
        ).innerHTML += `<img id="LoggedInProfilePicture" class="float-right" src=${GenericProfilePhoto}>`;
      } else if (data == "TOKEN FAIL") {
        console.log("User not logged in");
        document.getElementById(
          "LoggedInProfilePictureSpace"
        ).innerHTML += `<img id="LoggedInProfilePicture" class="float-right" src=${GenericProfilePhoto}>`;
      } else {
        console.log("Insert profile picture for logged user");
        logged_user_profile_photo = data[0].profile_picture;
        document.getElementById(
          "LoggedInProfilePictureSpace"
        ).innerHTML += `<img id="LoggedInProfilePicture" class="float-right" src="${logged_user_profile_photo}" referrerpolicy="no-referrer">`;
      }
    });
  } catch (err) {
    console.log("Error: " + err);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //// *** POPULATE PROFILE DATA *** ////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // GET VIDEOS
  var GetVideoUrl = server + "/Videos?user_id=" + user_id;
  $.get(GetVideoUrl, function (VideoList, status) {
    if (VideoList == false) {
      $(".VideosLoader").hide();
      document.getElementById("VideoPosition1").innerHTML +=
        "<h3 id='NoVideosFound'>No videos found</h3>";
      $("#ShowMore").hide();
    } else {
      var VideoCounter;
      for (VideoCounter = 0; VideoCounter < VideoList.length; VideoCounter++) {
        var VideoPositionInteger = VideoList[VideoCounter].content_desc;
        var VideoID = VideoList[VideoCounter].content;
        var ContentID = VideoList[VideoCounter].content_id;
        VideoElementID = "VideoPosition" + VideoPositionInteger;
        //console.log('value of VideoCounter = ', VideoCounter)
        console.log("video id", VideoID);
        if (VideoPositionInteger == 1) {
          document.getElementById(VideoElementID).innerHTML +=
            `<iframe id="iFrame${VideoPositionInteger}" width="900" height="450" src="https://www.youtube.com/embed/${VideoID}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` +
            `<input type = "image" src = "DeleteIcon.png" name = ${ContentID} class="DeleteContentButton OwnerElement"/>`;
        } else {
          document.getElementById(VideoElementID).innerHTML +=
            `<iframe id="iFrame${VideoPositionInteger}" width="340" height="200" src="https://www.youtube.com/embed/${VideoID}" title="YouTube video player" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` +
            `<input type = "image" src = "DeleteIcon.png" name = ${ContentID} class="DeleteContentButton OwnerElement"/>`;
        }
      }
      document.getElementById("iFrame" + VideoPositionInteger).onload =
        function () {
          $(".VideosLoader").slideUp("fast");
        };
    }
  });

  // GET MORE VIDEOS
  var MoreVideoClickCounter = 0;
  $(document).on("click", ".GetMoreVideos", function () {
    console.log("more video click counter:", MoreVideoClickCounter);
    if (MoreVideoClickCounter == 0) {
      console.log("/! getting more videos!");
      var GetMoreVideosUrl = server + "/GetMoreVideos?user_id=" + user_id;
      $.get(GetMoreVideosUrl, function (MoreVideosList, status) {
        if (MoreVideosList == false) {
          $(".MoreVideosLoader").hide();
        } else {
          var MoreVideosCounter;
          var NumberVideosToLoad = MoreVideosList.length;
          for (
            MoreVideosCounter = 0;
            MoreVideosCounter < NumberVideosToLoad;
            MoreVideosCounter++
          ) {
            var VideoPositionInteger =
              MoreVideosList[MoreVideosCounter].content_desc;
            var VideoID = MoreVideosList[MoreVideosCounter].content;
            var ContentID = MoreVideosList[MoreVideosCounter].content_id;
            VideoElementID = "VideoPosition" + VideoPositionInteger;
            console.log("value of MoreVideoCounter = ", MoreVideosCounter);
            console.log("video id", VideoID);
            document.getElementById(VideoElementID).innerHTML +=
              `<iframe id="iFrame${VideoPositionInteger}" width="340" height="200" src="https://www.youtube.com/embed/${VideoID}" title="YouTube video player" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>` +
              `<input type = "image" src = "DeleteIcon.png" name = ${ContentID} class="DeleteContentButton OwnerElement"/>`;
          }
          document.getElementById("iFrame" + VideoPositionInteger).onload =
            function () {
              $(".MoreVideosLoader").slideUp("fast");
            };
        }
      });
      $(".ShowMore").slideDown("slow");
      $("#ShowMore").slideUp();
      $("#ShowLess").show();
    } else {
      $(".ShowMore").slideDown("slow");
      $("#ShowMore").slideUp();
      $("#ShowLess").show();
    }
    MoreVideoClickCounter++;
  });

  // SHOW MORE VIDEOS

  $("#ShowLess").click(function () {
    $(".ShowMore").slideUp("fast");
    $("#ShowLess").hide();
    $("#ShowMore").show();
  });

  // GET PODCASTS
  var GetPodcastsUrl = server + "/Podcasts?user_id=" + user_id;
  //console.log('Loading podcasts...')

  $.get(GetPodcastsUrl, function (PodcastList, status) {
    $(".PodcastLoader").hide();
    if (PodcastList == false) {
    }
    for (var content_id in PodcastList) {
      if (PodcastList.hasOwnProperty(content_id)) {
        document.getElementById("PopulatePodcasts").innerHTML +=
          `<div class="col-2.4">` +
          `<a href = ${PodcastList[content_id].website} target = "_blank" > <img class="SavedPodcastThumbnail" src=${PodcastList[content_id].image} alt=${PodcastList[content_id].title}></a>` +
          `<input type = "image" src = "DeleteIcon.png" name = ${content_id} class="DeleteContentButton OwnerElement"/>` +
          `</div>`;
      }
    }
  });

  // GET PODCAST EPISODES
  var GetPodcastEpisodesUrl = server + "/PodcastEpisodes?user_id=" + user_id;
  //console.log('Loading podcast episodes...')

  $.get(GetPodcastEpisodesUrl, function (PodcastEpisodeList, status) {
    $(".PodcastEpisodeLoader").hide();
    if (PodcastEpisodeList == false) {
    }
    for (var content_id in PodcastEpisodeList) {
      desc = PodcastEpisodeList[content_id].description;
      console.log("Podcast description: ", desc);
      firstParagraph = desc.substr(0, desc.indexOf("</p>"));
      if (firstParagraph.length == 0) {
        PodcastTableDescription = "<p>" + desc + "</p>";
      } else {
        PodcastTableDescription = firstParagraph;
      }
      console.log("Podcast 1st paragraph: ", firstParagraph);
      console.log("Podcast table description: ", PodcastTableDescription);

      if (PodcastEpisodeList.hasOwnProperty(content_id)) {
        document.getElementById("podcast-episode-table").innerHTML +=
          `<tr>` +
          `<td rowspan ="2"> <input type="image" name=${PodcastEpisodeList[content_id].episodeID} class="SavedPodcastEpisodeThumbnail ClickToPlay" src=${PodcastEpisodeList[content_id].image}></td>` +
          `<td class="PodcastEpisodeTitle ClickToPlay"> ${PodcastEpisodeList[content_id].title}
          <br>
          ${PodcastTableDescription}
          <br>
          <input type="image" src="DeleteIcon.png" name=${content_id} class="DeleteContentButton OwnerElement"/>
          </td>` +
          `<td> <input class="PodcastPlayButton ClickToPlay" type="image" name=${PodcastEpisodeList[content_id].episodeID} src="pptPlay.png"></td>` +
          `</tr>` +
          `<tr>`;
      }
    }
  });

  // CLICK TO PLAY PODCAST EPISODE
  $(document).on("click", ".ClickToPlay", function () {
    window.location = "#PodcastPlayer";
    EpisodeToPlay = $(this).attr("name");
    console.log("to play = ", EpisodeToPlay);
    if ($("#PodcastPlayerFrame").length) {
      //Replace an existant player with a new one
      $("#PodcastPlayerFrame").remove();
      document.getElementById(
        "PodcastPlayer"
      ).innerHTML += `<iframe id=PodcastPlayerFrame src = "https://www.listennotes.com/embedded/e/${EpisodeToPlay}/" height = "300px" width = "100%" style = "width: 1px; min-width: 100%;" frameborder = "0" scrolling = "no" loading = "lazy"></iframe>`;
    } else {
      document.getElementById(
        "PodcastPlayer"
      ).innerHTML += `<iframe id=PodcastPlayerFrame src = "https://www.listennotes.com/embedded/e/${EpisodeToPlay}/" height = "300px" width = "100%" style = "width: 1px; min-width: 100%;" frameborder = "0" scrolling = "no" loading = "lazy"></iframe>`;
    }
  });

  //////////////////////////////////////////////////////////
  // GET ARTICLES
  ///////////////////////////////////////////////////////////
  var GetArticleUrl = server + "/Articles?user_id=" + user_id;
  $.get(GetArticleUrl, function (ArticleList, status) {
    var i;
    for (i = 0; i < ArticleList.length; i++) {
      var caption = ArticleList[i].content_desc;
      var articleLink = ArticleList[i].content;
      var contentID = ArticleList[i].content_id;

      var pathArray = articleLink.split("/");
      var protocol = pathArray[0];
      var host = pathArray[2];
      var baseUrl = protocol + "//" + host;
      document.getElementById("populateArticles").innerHTML +=
        `<li> <img height="18" width="18" src="http://www.google.com/s2/favicons?domain=${baseUrl}"/><a class=LinkText href=${articleLink} target="_blank">  ${caption}</a></li>` +
        `<input type = "image" src = "DeleteIcon.png" name = ${contentID} class="DeleteContentButton OwnerElement"/>`;
    }
  });

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

  ///////////////////////////  YOUTUBE ///////////////////////////
  $(document).on("click", ".AddYouTubeVideo", function (event) {
    console.log("Video submit button clicked");
    var CookieToken = getCookieValue("USER_SESSION_TOKEN");
    VideoPosition = event.target.id;
    VideoPositionInteger = VideoPosition.match(/\d+/)[0]; //get integer from string
    InputName = "YouTubeLink" + VideoPositionInteger;
    VideoInput = document.querySelector(`input[name=${InputName}]`).value;
    if (VideoInput.includes("youtube")) {
      var regExp =
        /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      var match = VideoInput.match(regExp);
      if (match && match[2].length == 11) {
        VideoID = match[2];
        console.log("Video ID = ", VideoID);
        try {
          $.post(server + "/AddYouTubeVideo", {
            token: CookieToken,
            ProfileId: user_id,
            VideoID: VideoID,
            Position: VideoPositionInteger,
          }).done(function (data) {
            console.log("length of response = ", data.length);
            console.log(" add video response data: ", data);
            if (data == true) {
              alert("Video Added");
            } else if (data == "TOKEN FAIL") {
              alert("Log in expired- please sign in again");
              window.location.href = server + "/ProfilePage?user_id=" + user_id;
            } else {
              alert("Video not added, please try again");
              window.location.href = server + "/ProfilePage?user_id=" + user_id;
            }
          });
        } catch (err) {
          console.log("failed to post to backend");
          console.log("Error: " + err);
        }
      } else {
        console.log(match);
        alert(
          "Error: Something went wrong - please ensure the link is from YouTube"
        );
      }
    } else {
      alert("Please enter a link from YouTube");
    }
  });

  ///////////////////////////  PODCASTS ///////////////////////////

  // PODCAST SEARCH
  var ShowSearchCount = 0;
  $(document).on("click", "#PodcastSearchButton", function () {
    ShowSearchCount += 1;
    $(".PodcastShowSearch").show();

    var CookieToken = getCookieValue("USER_SESSION_TOKEN");
    console.log("Search podcast function executed- ", $(this));
    $(".PodcastSearchResultsSection").show();
    PodcastSearchTerm = $("#PodcastSearchText").val(); //[0].value; // Retrieve submitted data
    console.log("search term = ", PodcastSearchTerm);
    PodcastSearchTermQueryFormat = PodcastSearchTerm.replaceAll(" ", "%20");
    console.log("To search: podcast name = ", PodcastSearchTermQueryFormat);

    try {
      $.post(server + "/SearchPodcasts", {
        token: CookieToken,
        ProfileId: user_id,
        PodcastSearchTerm: PodcastSearchTermQueryFormat,
      }).done(function (data) {
        console.log("Podcast Server response :", data);
        if (data == 429) {
          alert("Podcast partner quota limit reached for this month");
        } else if (data == false) {
          console.log("search fail");
          alert("No podcast found- try another search term");
        } else {
          console.log("podcast api response: ", data);
          for (var podcast_result_number in data) {
            title = data[podcast_result_number].title;
            thumbnail = data[podcast_result_number].thumbnail;
            listenURL = data[podcast_result_number].url;
            PodcastID = data[podcast_result_number].id;
            description = data[podcast_result_number].description;

            document.getElementById(
              "PodcastSearchResultThumbnails"
            ).innerHTML +=
              `<div class="col-2" id="PodcastSearchResultThumbnail_"${ShowSearchCount}>` +
              `<img height = "200" width = "200" src = ${thumbnail}></img>` +
              `</div>` +
              `<div class="row justify-content-center">` +
              `<div class="col-10 d-flex justify-content-between" id="PodcastDescription_${ShowSearchCount}>"></div>` +
              `<p> ${description}</p>` +
              `</div>` +
              `<button class="btn btn-light AddpodcastButton" id= ${PodcastID}> Add Podcast</button>` +
              `</div>`;
          }
        }
        $(".PodcastShowSearch").hide();
      });
    } catch (err) {
      console.log("failed to post to backend");
      console.log("Error: " + err);
    }
  });

  // PODCAST EPISODE SEARCH
  $(document).on("click", "#PodcastEpisodeSearchButton", function () {
    var CookieToken = getCookieValue("USER_SESSION_TOKEN");
    $(".PodcastEpisodeSearch").show();
    $(".PodcastEpisodeSearchResultsSection").show();
    PodcastEpisodeSearchTerm = $("#PodcastEpisodeSearchText").val(); //[0].value; // Retrieve submitted data
    PodcastEpisodeSearchTermQueryFormat = PodcastEpisodeSearchTerm.replaceAll(
      " ",
      "%20"
    );
    try {
      $.post(server + "/SearchPodcastEpisodes", {
        token: CookieToken,
        ProfileId: user_id,
        PodcastEpisodeSearchTerm: PodcastEpisodeSearchTermQueryFormat,
      }).done(function (data) {
        console.log("Server response :", data);
        if (data == 429) {
          alert("Podcast partner quota limit reached for this month");
        } else if (data == false) {
          alert("No episode found- try another search term");
          $(".ManualPodcastInput").show();
        } else {
          for (var result_number in data) {
            title = data[result_number].title;
            thumbnail = data[result_number].thumbnail;
            PodcastEpisodeID = data[result_number].id;
            if (result_number <= 1) {
              document.getElementById(
                "PodcastEpisodeSearchResultThumbnail_1"
              ).innerHTML +=
                `<div class="row">` +
                `<div class = "col">` +
                `<img height="60" width="60" class="PodcastEpisodeSearchThumbnail" src=${thumbnail} />` +
                `<p class="EpisodeSearchTitle">${title}</p>` +
                `<button class="btn btn-light AddpodcastEpisodeButton" id= ${PodcastEpisodeID}> Add Episode</button>` +
                `</div></div>`;
            } else if (result_number > 1 && result_number <= 3) {
              document.getElementById(
                "PodcastEpisodeSearchResultThumbnail_2"
              ).innerHTML +=
                `<div class="row">` +
                `<div class = "col-12">` +
                `<img height="60" width="60" class="PodcastEpisodeSearchThumbnail" src=${thumbnail} />` +
                `<p class="EpisodeSearchTitle">${title}</p>` +
                `</div></div>` +
                `<div class="row">` +
                `<div class = "col-12">` +
                `<button class="btn btn-light AddpodcastEpisodeButton" id= ${PodcastEpisodeID}> Add Episode</button>` +
                `</div></div>`;
            } else if (result_number > 3 && result_number <= 5) {
              document.getElementById(
                "PodcastEpisodeSearchResultThumbnail_3"
              ).innerHTML +=
                `<div class="row">` +
                `<div class = "col-12">` +
                `<img height="60" width="60" class="PodcastEpisodeSearchThumbnail" src=${thumbnail} />` +
                `<p class="EpisodeSearchTitle">${title}</p>` +
                `</div></div>` +
                `<div class="row">` +
                `<div class = "col-12">` +
                `<button class="btn btn-light AddpodcastEpisodeButton" id= ${PodcastEpisodeID}> Add Episode</button>` +
                `</div></div>`;
            } else if (result_number > 5 && result_number <= 7) {
              document.getElementById(
                "PodcastEpisodeSearchResultThumbnail_4"
              ).innerHTML +=
                `<div class="row">` +
                `<div class = "col-12">` +
                `<img height="60" width="60" class="PodcastEpisodeSearchThumbnail" src=${thumbnail} />` +
                `<p class="EpisodeSearchTitle">${title}</p>` +
                `</div></div>` +
                `<div class="row">` +
                `<div class = "col-12">` +
                `<button class="btn btn-light AddpodcastEpisodeButton" id= ${PodcastEpisodeID}> Add Episode</button>` +
                `</div></div>`;
            } else if (result_number > 7 && result_number <= 9) {
              document.getElementById(
                "PodcastEpisodeSearchResultThumbnail_5"
              ).innerHTML +=
                `<div class="row">` +
                `<div class = "col-12">` +
                `<img height="60" width="60" class="PodcastEpisodeSearchThumbnail" src=${thumbnail} />` +
                `<p class="EpisodeSearchTitle">${title}</p>` +
                `</div></div>` +
                `<div class="row">` +
                `<div class = "col-12">` +
                `<button class="btn btn-light AddpodcastEpisodeButton" id= ${PodcastEpisodeID}> Add Episode</button>` +
                `</div></div>`;
            }
            $(".ManualPodcastInput").show();
            window.location.href = "#EpisodeResults";
            $(".PodcastEpisodeSearch").hide();
          }
        }
      });
    } catch (err) {
      console.log("failed to post to backend");
      console.log("Error: " + err);
    }
  });

  // ADD PODCAST
  $(document).on("click", ".AddpodcastButton", function () {
    PodcastToAdd = this.id;
    var CookieToken = getCookieValue("USER_SESSION_TOKEN");

    try {
      $.post(server + "/AddPodcast", {
        token: CookieToken,
        ProfileId: user_id,
        PodcastId: PodcastToAdd,
      }).done(function (data) {
        if (data == 429) {
          alert("Podcast partner quota limit reached for this month");
        } else if (data == true) {
          alert("Podcast Added");
        } else if (data == "TOKEN FAIL") {
          alert("Log in expried- please sign in again");
          window.location.href = server + "/ProfilePage?user_id=" + user_id;
        } else {
          console.log(data);
          alert("Podcast not added, please try again");
          window.location.href = server + "/ProfilePage?user_id=" + user_id;
        }
      });
    } catch (err) {
      console.log("failed to post to backend");
      console.log("Error: " + err);
    }
  });

  // ADD PODCAST EPISODE
  $(document).on("click", ".AddpodcastEpisodeButton", function () {
    var CookieToken = getCookieValue("USER_SESSION_TOKEN");
    PodcastEpisodeToAdd = this.id;
    try {
      $.post(server + "/AddPodcastEpisode", {
        token: CookieToken,
        ProfileId: user_id,
        PodcastEpisodeID: PodcastEpisodeToAdd,
      }).done(function (data) {
        if (data == 429) {
          alert("Podcast partner quota limit reached for this month");
        } else if (data == true) {
          alert("Podcast Episode Added");
        } else if (data == "TOKEN FAIL") {
          alert("Log in expired- please sign in again");
          window.location.href = server + "/ProfilePage?user_id=" + user_id;
        } else {
          console.log(data);
          alert("Podcast Episode not added, please try again");
          window.location.href = server + "/ProfilePage?user_id=" + user_id;
        }
      });
    } catch (err) {
      console.log("failed to post to backend");
      console.log("Error: " + err);
    }
  });

  // POST ADD ARTICLE REQUEST: DESCRIPTION
  // FUNCTION: Allow proflie owner to add content to her own profile (and not someone else's)
  // 1) Retrieve data submitted by user in a form
  // 2) Send CookieToken, user profile id and submitted link to BackEnd route Add ...
  // 3) If token is valid and profile user Id matches stored google id, corresponding to token then;
  // 4) Set the page 'location' = to the page 'location' => refresh the page. This automatic refresh upon success will then load the newly added video via the Video request, above
  // 5) Else, send Alert
  $(document).on("click", "#PostArticleButton", function () {
    ArticleLink = document.querySelector("input[name=ArticleLink]").value;
    ArticleDescription = document.querySelector(
      "input[name=ArticleDescription]"
    ).value;
    var CookieToken = getCookieValue("USER_SESSION_TOKEN");

    // console.log('To post: User id cookie retrieved: ', user_id, 'with article: ', link)
    try {
      // CLOSE THIS CLAUSE
      $.post(server + "/AddArticle", {
        token: CookieToken,
        ProfileId: user_id,
        ArticleLink: ArticleLink,
        ArticleDescription: ArticleDescription,
      }).done(function (data) {
        if (data == true) {
          $("#ArticleLinkInput").val("");
          $("#ArticleDescriptionInput").val("");
          alert("Link Added");
        } else if (data == "TOKEN FAIL") {
          alert("Log in expried- please sign in again");
          window.location.href = server + "/ProfilePage?user_id=" + user_id;
        } else {
          console.log(data);
          alert("Link not added, please try again");
          window.location.href = server + "/ProfilePage?user_id=" + user_id;
        }
      });
    } catch (err) {
      console.log("failed to post to backend");
      console.log("Error: " + err);
    }
  });

  /////////////
  // READING LIST
  /////////////
  // POST ADD LINK REQUEST: DESCRIPTION
  // FUNCTION: Allow proflie owner to add content to her own profile (and not someone else's)

  $(document).on("click", "#PostReadingListButton", function () {
    ReadingListLink = document.querySelector(
      "input[name=ReadingListLink]"
    ).value;
    ReadingListDescription = document.querySelector(
      "input[name=ReadingListDescription]"
    ).value;
    var CookieToken = getCookieValue("USER_SESSION_TOKEN");

    try {
      $.post(server + "/AddReadingList", {
        token: CookieToken,
        ProfileId: user_id,
        ReadingListLink: ReadingListLink,
        ReadingListDescription: ReadingListDescription,
      }).done(function (data) {
        if (data == true) {
          $("#ReadingListLinkInput").val("");
          $("#ReadingListDescriptionInput").val("");
          alert("Link Added");
        } else if (data == "TOKEN FAIL") {
          alert("Log in expried- please sign in again");
          window.location.href = server + "/ProfilePage?user_id=" + user_id;
        } else {
          console.log(data);
          alert("Link not added, please try again");
          window.location.href = server + "/ProfilePage?user_id=" + user_id;
        }
      });
    } catch (err) {
      console.log("failed to post to backend");
      console.log("Error: " + err);
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //// *** DISCOVERY *** ////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // DISCOVER ARTICLE
  $(document).on("click", "#ArticleDiscovery", function () {
    console.log("discover article clicked");
    DiscoverArticleUrl = server + "/DiscoverArticle?user_id=" + user_id;
    $.get(DiscoverArticleUrl, function (UsersArticles, status) {
      RandomArticlePosition = Math.floor(Math.random() * UsersArticles.length);
      DisoveryArticle = UsersArticles[RandomArticlePosition].content;
      console.log("Article to discover", DisoveryArticle);

      window.open(DisoveryArticle, "_blank"); // <- This is what makes it open in a new window.
    });
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //// *** DELETE DATA *** ////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  $(document).on("click", ".DeleteContentButton", function () {
    var CookieToken = getCookieValue("USER_SESSION_TOKEN");

    console.log("DELETE CLICKED");
    ContentToDelete = $(this).attr("name");
    var requestString = server + "/DeleteArticle";

    try {
      $.ajax({
        url:
          requestString +
          "?" +
          $.param({
            ContentToDelete: ContentToDelete,
            token: CookieToken,
            ProfileId: user_id,
          }),
        type: "DELETE",
        success: function (result) {
          console.log("delete request = ", result);
          if ((result = true)) {
            console.log("item deleted");
            alert("Item Deleted");
          } else {
            alert("Item not deleted, please try again (error: ", data, " )");
          }
        },
      });
    } catch (err) {
      console.log("failed to post to backend");
      console.log("Error: " + err);
    }
  }); // End of document.ready()
});
