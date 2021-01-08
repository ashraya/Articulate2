package controllers;

import org.json.simple.JSONObject;
import server.Main;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.concurrent.ThreadLocalRandom;

@Path("card/")
@Consumes(MediaType.MULTIPART_FORM_DATA)
@Produces(MediaType.APPLICATION_JSON)

public class Card {
    private int getMaxId(String gameLevel){
        int max = 0;
        //Based on the gameLevel, get the MaxID from the appropriate Table
        //This adaptation is to re-use the code rather than create another function
        //for the kids table
        String tblName="Cards";
        if (gameLevel.equals("kids")) {
            tblName="kidsCards";
        }
        String query = "SELECT CardID FROM " + tblName + " ORDER BY CardID DESC LIMIT 1";  //means order the records in descending order of WordID and take only the first which will have the highest ID value
        try (Statement stmt = Main.db.createStatement()) {
            ResultSet rs = stmt.executeQuery(query);
            while (rs.next() == true) {
                max = rs.getInt("CardID");
            }
        } catch (SQLException e) {
            System.out.println("Database error: " + e.getMessage());
        }
        return max;
    }

    @GET
    @Path("getWord/{gameLevel}/{categoryName}")
    public String getWord(@PathParam("gameLevel") String gameLevel,
                          @PathParam("categoryName") String category){

        // Ensure that gameLevel is always one of these two values
        if ((! gameLevel.equals("kids")) && (! gameLevel.equals("original"))) {
            gameLevel = "original";
        }
        String tblName="Cards";
        if (gameLevel.equals("kids")) {
            tblName="kidsCards";
        }
        JSONObject response = new JSONObject();
        int max = getMaxId(gameLevel);
        //Added the following to check if number was zero after kids table
        //was added but did not have data yet
        if ( max == 0 ){
            response.put("Error", "Table Not populated");
            return response.toString();
        }
        int randomID = ThreadLocalRandom.current().nextInt(1, getMaxId(gameLevel));
        try {
            PreparedStatement ps = null;
            switch (category) {
                case "Person":
                    ps = Main.db.prepareStatement("SELECT Person FROM " + tblName + " WHERE CardID = ?");
                    break;
                case "World":
                    ps = Main.db.prepareStatement("SELECT World FROM "+tblName+" WHERE CardID = ?");
                    break;
                case "Object":
                    ps = Main.db.prepareStatement("SELECT Object FROM "+tblName+" WHERE CardID = ?");
                    break;
                case "Action":
                    ps = Main.db.prepareStatement("SELECT Action FROM "+tblName+" WHERE CardID = ?");
                    break;
                case "Nature":
                    ps = Main.db.prepareStatement("SELECT Nature FROM "+tblName+" WHERE CardID = ?");
                    break;
                case "Random":
                    ps = Main.db.prepareStatement("SELECT Random FROM "+tblName+" WHERE CardID = ?");
                    break;
                case "Spade":
                    ps = Main.db.prepareStatement("SELECT Spade FROM "+tblName+" WHERE CardID = ?");
                    break;
            }
            ps.setInt(1, randomID);
            ResultSet results = ps.executeQuery();
            if ( results.next() == true) {
                response.put("Word", results.getString(1));
                response.put("Status", "Success");
            } else {
                response.put("Error", "Failure getting Word");
            }
        } catch(Exception e) {
            response.put("Error", "Exception getting Word");
        }
        return response.toString();
    }
}