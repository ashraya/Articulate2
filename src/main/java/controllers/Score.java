package controllers;

import org.glassfish.jersey.media.multipart.FormDataParam;
import org.json.simple.JSONObject;
import org.json.simple.parser.*;

import server.Main;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import org.apache.commons.lang.RandomStringUtils;

@Path("score/")
@Consumes(MediaType.MULTIPART_FORM_DATA)
@Produces(MediaType.APPLICATION_JSON)

public class Score {
    private String getUniqueID(){
        String res="";
        while (res.equals("")) {
            res = RandomStringUtils.random(4, true, true).toUpperCase()
                    + "-" + RandomStringUtils.random(4, true, true).toUpperCase();
            String query = "Select gameID from gameScores where gameID = ?";
            try {
                PreparedStatement ps = Main.db.prepareStatement(query);
                ps.setString(1, res);
                ResultSet rs = ps.executeQuery();
                if (rs.next() == true) {
                    res = "";
                } else {
                    return res;
                }
            }catch(Exception e) {
                System.out.println("Database Error: " + e.getMessage());
                return "ERROR";
            }
        }
        return res;
    }

    @POST
    @Path("newGame")
    public String newGame(@FormDataParam("gameLevel") String gameLevel){
        JSONObject response = new JSONObject();
        String newGameID = getUniqueID();
        if ((! gameLevel.equals("original")) && (! gameLevel.equals("kids"))){
            gameLevel="original";
        }
        try {
            PreparedStatement ps;
            ps = Main.db.prepareStatement("insert into gameScores (gameID, team1Score, team2Score, nextPlay, gameLevel) Values(?, ?, ?, ?, ?)");
            ps.setString(1, newGameID);
            ps.setInt(2, 0);
            ps.setInt(3, 0);
            ps.setString(4, "Team1");
            ps.setString(5, gameLevel);
            ps.execute();
            response.put("Status", "Success");
            response.put("gameID", newGameID);
        } catch (Exception e){
            System.out.println(e.toString());
            response.put("Error", "Failure");
        }
        return response.toString();
    }

    @GET
    @Path("getGameStats/{gameID}")
    public String getGameStats(@PathParam("gameID") String gameID) {
        System.out.println("Invoked getGameStats");
        JSONObject response = new JSONObject();
        PreparedStatement ps;
        try {
            ps = Main.db.prepareStatement("Select * from gameScores where gameID = ?");
            ps.setString(1, gameID);
            ResultSet results = ps.executeQuery();
            if (results.next()) {
                response.put("team1Score", results.getInt("team1Score"));
                response.put("team2Score", results.getInt("team2Score"));
                response.put("nextPlay", results.getString("nextPlay"));
                response.put("gameLevel", results.getString("gameLevel"));
                response.put("Status", "Success");
            } else {
                response.put("Error", "No Game with that ID");
            }
        } catch (Exception e) {
            response.put("Error", "Failure");
        }
        return response.toString();
    }

    @POST
    @Path("updateScore")
    public String updateScore(@FormDataParam("gameID") String gameID,
                              @FormDataParam("turnScore") int turnScore){
        JSONObject response = new JSONObject();
        Long t1Score;
        Long t2Score;
        String nextPlay;
        /***************
         * Function of 2 Parts.
         * In first Part, read the current scores and who is playing from getGameStats
         * Because it is in JSON format, parse it in and get it into the variables as
         * required.
         * In the second part, add the turnScore to the team that is playing now.
         * Also set the opposite as the team to play next
         * Execute query to update the database
         ***************/
        try {
            JSONParser parser = new JSONParser();
            String strData = getGameStats(gameID); //re-use getGameStats
            JSONObject data = (JSONObject) parser.parse(strData);
            t1Score = (Long) data.get("team1Score");
            t2Score = (Long) data.get("team2Score");
            nextPlay = (String) data.get("nextPlay");
        } catch (Exception e) {
            response.put("Error", "Failure");
            return response.toString();
            //Exception, End the function here with a error response
        }
        /***************
         * If the stored nextPlay is Team1, add score to team1 but change nextPlay for storing as Team2
         * If the stored nextPlay is Team2, add score to team2 but change nextPlay for storing as Team1
         ***************/
        if (nextPlay.equals("Team1")) {
            t1Score = t1Score + turnScore;
            nextPlay = "Team2";
        } else {
            t2Score = t2Score + turnScore;
            nextPlay = "Team1";
        }
        // Update the Score in the Database Finally
        try {
            PreparedStatement ps;
            ps = Main.db.prepareStatement("update gameScores set team1Score=?, team2Score=?, nextPlay=? where gameID=?");
            ps.setLong(1, t1Score);
            ps.setLong(2, t2Score);
            ps.setString(3, nextPlay);
            ps.setString(4, gameID);
            ps.execute();
            response.put("Status", "Success");
        } catch (Exception e){
            response.put("Error", "Failure");
        }
        return response.toString();
    }

}