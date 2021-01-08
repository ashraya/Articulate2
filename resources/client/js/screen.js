"use strict";
let team1Marker='<span class="spnMarker">&#9822</span>';
let team2Marker='<span class="spnMarker">&#9820</span>';
let categories = ["Object", "Nature", "Person", "Action", "Spade", "Random", "World"];

let gameLevel="";
let nextPlay="";
let t1Score=0;
let t2Score=0;
let turnScore="";
let gameID="";
let theTimer=null;

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

function pageLoad(){
    gameLevel = getUrlParameter("gameLevel");
    if ((gameLevel != "original") && (gameLevel !="kids")){
        gameLevel="original";
    }
    gameID = getUrlParameter("gameID");
    if (gameID == "") { //if the game ID is nothing, a new game will start
        let frmTarget = "/score/newGame";
        let frmData = new FormData();
        frmData.append("gameLevel", gameLevel);
        const result = fetch(frmTarget, {method: "POST", body: frmData}).then(response =>{
            return response.json();
        }).then( response => {
            if (response.hasOwnProperty("Error")) { //checks if response from server has a key "Error"
                alert("Error Generating Game ID!  Unable to Continue!")    // if it does, convert JSON object to string and alert
                gameRedirect("/client/Screen/home.html");
            } else {
                gameID = response.gameID;
                gameRedirect("/client/Screen/board.html?gameLevel="+gameLevel+"&gameID="+gameID);
            }
        });
    } else {
        refreshBoard();
        countdown();
        document.getElementById("qrcode").setAttribute("src", "/qr/code?gameID=" + gameID);

    }
}

function countdown() {
    /*
     */
    theTimer = setInterval(refreshBoard, 5000);
}

function refreshBoard(){
    /*
     This function is called in multiple places to refresh the game board
     It is used to do the following things:
      - it updates scores in the right hand sideColumn
      - it updates position of the game markers according the scores of each team
      - it determines the category of words for the next round.
     */
    let msg = "The Game is Completed!  Congratulations to ";
    const gameStats = fetch("/score/getGameStats/" + gameID, {method: "GET"})
        .then(response => {
            return response.json();
        }).then(response => {
            if (response.hasOwnProperty("Error")) {
                alert(JSON.stringify(response));
            } else {
                nextPlay = response.nextPlay;
                t1Score = response.team1Score;
                t2Score = response.team2Score;
                if (t1Score >= 56) {
                    t1Score = 56;
                    msg = msg + "Team 1!";
                }
                if (t2Score >= 56) {
                    t2Score = 56;
                    msg = msg + "Team 2!";
                }
                updateScores(t1Score, t2Score);
                updateMarkers(t1Score, t2Score);
                if ((t1Score == 56) || (t2Score == 56)) {
                    let mbox = document.getElementById("msgBox");
                    mbox.style.display = "block";
                    mbox.innerHTML = msg;
                }
                console.log("Alert");
            }
        });
}

function updateScores(t1Score, t2Score) {
    /*
    This function is called when the scores need to be updated at the end of each round
     */
    document.getElementById("t1Score").innerHTML = t1Score;
    document.getElementById("t2Score").innerHTML = t2Score;
    document.getElementById("gameID").innerHTML = gameID;
    document.getElementById("nextPlay").innerHTML = nextPlay;
}

function updateMarkers(t1Score, t2Score) {
    /*
     This function is called by refreshBoard
     It is used to update the position of the markers after each round.
     The current/ previous marker position of team1 and team2 isn't kept track of on the server side.
     So it is easier to clear the board and remove markers drawn in any position before updating
     */
    clearAllSquares();
    drawMarkers(t1Score, t2Score);
}

function clearAllSquares(){
    for (let id=0; id<=56; id++){
        let el = "sqr"+id;
        document.getElementById(el).innerHTML = "";
    }
}

function drawMarkers(t1Score, t2Score) {
    /*
     This function is also called by refreshBoard.
     When the scores are the same for both teams, the standard marker code will position the makers
     vertically adjacent to each other.
     To avoid this we recognise that specific condition and draw the markers slightly differently.
     */
    let el= "";
    let iHTML = "";
    if (t1Score == t2Score) {
        el = "sqr" + t2Score;
        iHTML = "<div>" + team1Marker + team2Marker + "</div>";
        document.getElementById(el).innerHTML = iHTML;
    } else {
        el = "sqr" + t1Score;
        iHTML = "<div>" + team1Marker + "</div>";
        document.getElementById(el).innerHTML = iHTML;
        el = "sqr" + t2Score;
        iHTML = "<div>" + team2Marker + "</div>";
        document.getElementById(el).innerHTML = iHTML;

    }
}

function populateAdminTable(){
    /*
    This function is used in admin.html to bring up the table of words in order
    for the user to add to the records or edit them.
     */
    let tableName="WordList";
    gameLevel = getUrlParameter("gameLevel");
    let url = "/admin/getAll/" + gameLevel;
    console.log("Getting file: " + url);
    fetch(url, {method: "GET"}).then( response => {
        return response.json();
    }).then (response => {
        if (response.hasOwnProperty("Error")) { //checks if response from server has a key "Error"
            alert(JSON.stringify(response));    // if it does, convert JSON object to string and alert
        } else {
            refreshTable(tableName, response);
            document.getElementById("gameLevel").value = gameLevel;
        };
    });
}

function refreshTable(tableName, response){
    /*
    once the user has finished making their edits to the table, this function refreshes the tables
    so they can see their changes
     */
    removeAllRows(tableName);
    for ( let id in response){
        addTableRow(tableName, id, response[id])
    }
}
function removeAllRows(tableName) {
    /*
    this function removes row from the table
     */
    let tblObject = document.getElementById(tableName);
    // Remove any existing rows except for the title row
    tblObject.removeChild(tblObject.getElementsByTagName("tbody")[0]);
    let tblBody = document.createElement("tbody");
    tblObject.appendChild(tblBody);
}
function addTableRow(tableName, id, jsonElements){
    /*
    this function is used to add rows to the table
     */
    let tblObject = document.getElementById(tableName);
    let tblBody = tblObject.getElementsByTagName("tbody")[0];
    let tblRow = tblBody.insertRow();
    tblRow.insertCell(0).innerHTML = id;
    tblRow.insertCell(1).innerHTML = jsonElements["Person"];
    tblRow.insertCell(2).innerHTML = jsonElements["Object"];
    tblRow.insertCell(3).innerHTML = jsonElements["Random"];
    tblRow.insertCell(4).innerHTML = jsonElements["Nature"];
    tblRow.insertCell(5).innerHTML = jsonElements["World"];
    tblRow.insertCell(6).innerHTML = jsonElements["Action"];
    tblRow.insertCell(7).innerHTML = jsonElements["Spade"];
    tblRow.insertCell(8).innerHTML = '<button onClick="setEdit(event)">Edit</button>';
}

function setEdit(event){
    /*
    this function is used to edit any of the rows in a table.
     */
    let xButton = event.target;
    let xRow = xButton.parentElement.parentElement;
    document.getElementById("Person").value = xRow.getElementsByTagName('td')[1].innerHTML;
    document.getElementById("Object").value = xRow.getElementsByTagName('td')[2].innerHTML;
    document.getElementById("Random").value = xRow.getElementsByTagName('td')[3].innerHTML;
    document.getElementById("Nature").value = xRow.getElementsByTagName('td')[4].innerHTML;
    document.getElementById("World").value = xRow.getElementsByTagName('td')[5].innerHTML;
    document.getElementById("Action").value = xRow.getElementsByTagName('td')[6].innerHTML;
    document.getElementById("Spade").value = xRow.getElementsByTagName('td')[7].innerHTML;
    document.getElementById("CardId").value = xRow.getElementsByTagName('td')[0].innerHTML;
    document.getElementById("gameLevel").value = gameLevel;
}

function setNew(){
    document.getElementById("Person").value = "";
    document.getElementById("Object").value = "";
    document.getElementById("Random").value = "";
    document.getElementById("Nature").value = "";
    document.getElementById("World").value = "";
    document.getElementById("Action").value = "";
    document.getElementById("Spade").value = "";
    document.getElementById("CardId").value = 0;
    document.getElementById("gameLevel").value = gameLevel;
}

function tableUpdateWrapper(){
    alert("Update Success");
    populateAdminTable();
}

function passwordChangeWrapper(){
    alert("Password Change Succeeded");
}

function loginSuccessWrapper(){
    gameRedirect("/client/Admin/admin.html");
}

function helpSuccessWrapper(){
    alert("Submitted.  Our team will take your feedback and address appropriately");
}

function frmSubmit(event, callback){
    event.preventDefault();
    let frmObject = event.target;
    let frmData = new FormData(frmObject);
    let frmTarget = frmObject.getAttribute("action");
    const result = fetch(frmTarget, {method: "POST", body:frmData}).then(response =>{
        return response.json();
    }).then( response => {
        if (response.hasOwnProperty("Error")) { //checks if response from server has a key "Error"
            alert(JSON.stringify(response));
        } else {
            callback();
        }
    });
    return false;
}


function checkAuthentication(){
    const result = fetch("/admin/checkAdminLogin", {method: "GET"}).then(response =>{
        return response.json();
    }).then( response => {
        if (response.hasOwnProperty("Error")) { //checks if response from server has a key "Error"
            gameRedirect("/client/Screen/login.html");
        }
    });
}