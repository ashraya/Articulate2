let skipdone=false;
let categories = ["Object", "Nature", "Person", "Action", "Spade", "Random", "World"];
let gameID = "";
let gameLevel = "";
let nextPlay = "";
let category = "";
//set seconds
let timeLeft = 10;
let theTimer = null;
let turnScore = 0;
let cScore =0;

function getUrlParameter(name) {
    /*
    this function is for the javascript to be able to read the parameters in the URL.
    Since this is a commonly used function in JavaScript, I borrowed it from an online source.
     */
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    let regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    let results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function gameRedirect(newURL){
    /*
    this function is used to either redirect the user back to the home page if there is an error
    or direct them to the page where they can play the game
     */
    window.location.replace(newURL);
}

function goHome(){
    gameRedirect("/client/Mobile/connect.html")
}

function goHelp(){
    gameRedirect("/client/Mobile/help.html")
}

function goConnect(){
    let gameID = document.getElementById("gID").value;
    const gameStats = fetch("/score/getGameStats/" + gameID, {method: "GET"})
        .then(response => {
            return response.json();
        }).then(response => {
            console.log(response.Error);
            if (response.hasOwnProperty("Error")) {
                alert("Could not Connect to the Game ID specified");
            } else {
                gameRedirect("/client/Mobile/card.html?gameID=" + gameID);
            }
        });
}

function pageLoad(){
    gameID = getUrlParameter("gameID");
    document.getElementById("btnPlay").disabled = true;
    document.getElementById("btnPause").disabled = true;
    document.getElementById("nextWord").disabled = true;
    document.getElementById("skipWord").disabled = true;
    document.getElementById("timerWrap").innerHTML=timeLeft;
    const gameStats = fetch("/score/getGameStats/" + gameID, {method: "GET"})
        .then(response => {
            return response.json();
        }).then(response => {
            document.getElementById("teamName").innerHTML = response.nextPlay;
            nextPlay=response.nextPlay;
            gameLevel = response.gameLevel;
            nextPlay = response.nextPlay;
            let t1Score = response.team1Score;
            let t2Score = response.team2Score;
            if ((t1Score >= 56) || (t2Score >= 56)){
                goPause();
                document.getElementById("btnStart").disabled=true;
                document.getElementById("btnPlay").disabled=true;
                document.getElementById("timerWrap").innerHTML="";
                let msg = "Game has been Completed.  Congratulations to "
                if (t1Score >= 56) {
                    msg = msg + "Team 1";
                } else {
                    msg = msg + "Team 2";
                }
                let mbox = document.getElementById("msgBox");
                mbox.style.display = "block";
                mbox.innerHTML = msg;
            }
            if (nextPlay == "Team1") {
                cScore = response.team1Score;
            } else {
                cScore = response.team2Score;
            }
            cScore = cScore % 7;
            if (cScore > 0) { cScore = cScore-1; }
            document.getElementById("sdCategory").innerHTML= categories[cScore];
            category = categories[cScore];
        });
}

function nextWord(){
    turnScore = turnScore+1;
    getWord();
}

function skipWord(){
    getWord();
    skipdone = true;
    document.getElementById("skipWord").disabled = true;
}

function goPlay() {
    /*
    this function is used at the start of each team's turn.
    In this function the countdown and getWordWrapper functions are called.
     */
    countdown();
    document.getElementById("btnStart").disabled = true;
    getWord();
}

function goPause() {
    /*
    This function is used to include the pause game functionality.
    It is mostly for ease of use.
     */
    clearInterval(theTimer);
    document.getElementById("btnPlay").disabled = false;
    document.getElementById("btnPause").disabled = true;
    document.getElementById("nextWord").disabled = true;
    document.getElementById("skipWord").disabled = true;
}

function refreshTimer(){
    /*
    this function is called every 1000 milliseconds by countdown.
    Each teams turn is assumed to be 60 seconds
    If 60 seconds have not passed the function simply updates the screen
    with the number of seconds left and exits.
    If there is no more time left, the function disabled the appropriate buttons
    so the turn can't continue and then updates the current score in the database.
     */
    timeLeft--;
    let secondsString = String(timeLeft % 60);
    document.getElementById("timerWrap").innerHTML = (secondsString.length == 1 ? "0" : "") + secondsString;
    if (timeLeft < 0) {
        console.log("timeLeft Magically reduced");
        clearInterval(theTimer);// makes sure the timer doesn't go negative
        document.getElementById("timerWrap").innerHTML = "00";
        document.getElementById("nextWord").disabled = true;
        document.getElementById("skipWord").disabled = true;
        document.getElementById("btnPlay").disabled = true;
        document.getElementById("btnPause").disabled = true;
        let url = "/score/updateScore";
        let frmData = new FormData();
        frmData.append("gameID", gameID);
        frmData.append("turnScore", turnScore);
        fetch(url, {method: "POST", body: frmData}).then( response => {
            return response.json();
        }).then (response => {
            if (response.hasOwnProperty("Error")) { //checks if response from server has a key "Error"
                alert(JSON.stringify(response));    // if it does, convert JSON object to string and alert
                gameRedirect("/client/Mobile/connect.html");
            } else {
                gameRedirect("/client/Mobile/card.html?gameID="+gameID);
            };
        });
    }
}

function countdown() {
    /*
    This function is invoked on each team's turn
    it uses refreshTimer as the callback function for setInterval
     */
    theTimer = setInterval(refreshTimer, 1000);
    document.getElementById("btnPlay").disabled = true;
    document.getElementById("btnPause").disabled = false;
    document.getElementById("nextWord").disabled = false;
    if (skipdone == false) {
        document.getElementById("skipWord").disabled = false;
    } else {
        document.getElementById("skipWord").disabled = true;
    }

}

function getWord(){
    console.log("Invoked getWord()");
    const cx = fetch("/card/getWord/" + gameLevel + "/" + category, {method: "GET"})
        .then( response => {
            return response.json();
        }).then ( response => {
            if ( response.hasOwnProperty("Error")) {
                alert(JSON.stringify(response));
            } else {
                document.getElementById("sdWord").innerHTML = response.Word;
            }
        });
}