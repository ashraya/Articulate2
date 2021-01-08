package controllers;

import javax.ws.rs.*;
import javax.ws.rs.core.HttpHeaders;
import java.io.ByteArrayOutputStream;

import net.glxn.qrgen.QRCode;
import net.glxn.qrgen.image.ImageType;

@Path("qr/")

public class QCode {
    @GET
    @Path("code")
    @Produces({"image/jpeg,image/png"})

    public byte[] getQRCode(@HeaderParam(HttpHeaders.HOST) String host, @QueryParam("gameID") String gameID) {
        String urlPath="/client/Mobile/connect.html";
        if (! gameID.equals("")) {
            urlPath = "/client/Mobile/card.html?gameID=" + gameID;
        }
        ByteArrayOutputStream out = QRCode.from("http://" + host + urlPath)
                .to(ImageType.PNG).stream();
        return out.toByteArray();
    }
}