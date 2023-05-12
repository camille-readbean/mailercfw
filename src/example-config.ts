// EDIT config AND COPY THIS FILE TO "src/config.ts"

export type ApiKeyConfig = {
    apiKey: string;
    allowedToDomain: string[];
    allowedFromAddr: string;
    allowedFromName: string;
}

export type toEmail = {
    email: string;
    name: string;
}
export type MailRequest = {
    apiKey: string;
    message: mailMessage;
    toAddr: [toEmail];
}

export type Content = [{
    type: string;
    value: string;
}]

export type mailMessage = {
    subject: string;
    content: Content;
}

// CHANGE HERE

export const config: {[APIUser: string]: ApiKeyConfig} = {
    // send request to "$DOMAINNAME/mailcfw/$APIUSERNAME"
    // CHANGE BELOW AND ADD AS MANY ACCORDINGLY
    // max user length 16 characters
    "UKgH5vUeLD5hTEHE" : {
        apiKey: "StarBrickKovefefeBeanVerylongPassword",
        // NO pattern matching, domain email must be exact
        // only domains this user / api call is allowed to send to
        allowedToDomain: ["gmail.com", "u.nus.edu"],
        // ONLY ONE ALLOWED from address
        allowedFromAddr : "do-not-reply@[ENTER YOUR DOMAIN HERE]",
        allowedFromName: "Do Not Reply"
    }
}

// END

// fake Nginx Error Page
// returns 404 on a lot of path to prevent bots
// although this obsfucation can be defeated by just looking at the headers lol
export function errorPageTag(err: string, msg: string=""): string{
    return `<html> 
<head><title>${err}</title></head>
<body>
<center><h1>${err}</h1>${msg != "" ? msg + "\n" : ""}</center>
<hr><center>nginx/1.21.6</center>
</body>
</html>`
}

export var error404Page = errorPageTag("404 Not found");