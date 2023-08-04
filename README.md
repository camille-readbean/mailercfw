# Mail, Cloudflare Worker
:warning: THIS IS A TOY PROJECT :warning:  


Simple cloudflare worker-based api for sending transactional emails.  
Have simple authentication (HTTP basic level) so only users with keys can send emails.   
Also have bounds / limits on allowed domains to send to in `config.ts`.    
Sender email address is hard coded into `config.ts`.  

Uses the Mailchannel's transaction API (https://api.mailchannels.net/tx/v1/documentation) for sending emails.  
Think of it as a simple wrapper of the api with some validation and authentication features (via **hard coded keys**) so you can expose the api on a serverless application. Mainly for personal use and sending transactional emails from projects. Authentication to deter bots from calling it.    
  
Yes I know twilio exist...  
  
It also pretends to be a Nginx web server in its error pages.

----

You need wrangler and a domain on cloudflare.  
Inside the `src/` directory copy `example-config.ts` to `config.ts` and edit the variables accordingly  

:warning: :exclamation: :triangular_flag_on_post:  AUTHENTICATION VALUES ARE HARD CODED INTO `config.ts` :warning: :exclamation: :triangular_flag_on_post:  
  
> potenial room for public key based authentication although this add costs to the calling backend...

This prevents / avoids the use of features like environment variables, durable objects or other persistent storage / databases, allowing this to be more standalone. 

AGAIN THIS PROJECT FOR LEARNING TYPESCRIPT, NOT FOR PRODUCTION, USE AT YOUR OWN RISK  
  
----

API
----
The worker listens for HTTP POST requests to `/mailercfw/{user}` where `{user}` is a key (up to 16 characters long) in the config object. The body of the request should be a JSON object with the following properties:

- `apiKey (string)`: The API key associated with the user.  
- `message (object)`: An object with subject and content properties representing the email message.  
- `toAddr (array)`: An array of objects representing the email recipients. Each object should have name and email properties. They are validated against the allowed domains in the configuration.    

If any of the above properties are missing or invalid, the worker will return a `400 Bad Request` response.

If the `user` is invalid the worker will return a `404 Not Found` response.

If the `apiKey` is invalid the worker will return a `401 Authorization Required` response.

If the `email` domains of _any recipient_ are not authorized, the worker will return a `400 Bad Request` response.

If the any part of the worker failed, the worker will return a `500 Internal Server Error` response with the error.

If the **POST** request for the email to mailchannel is **sent successfully**, the worker will return a response with a text body containing the response status and message from the MailChannels API _with the status code of the forwarded request_.  
i.e. it means the status code of the MailChannels API request is passed through

----
Example use (python, see mailcfw_client.py):
```
from mailcfw_client import send_email
send_email(subject='Hi', message='Hi there', email='camille@ruibin.me', name='Camille',
           mailer_api_key='KEY HERE', mailer_api_user='API USER')
```


Example use (curl):
```
curl -H "content-type: application/json" \
  {workersurl}/mailcfw/{APIUser} \
 -d @example.json

>
> 202 Accepted
> null
```

`example.json`:
```
{
    "message": {
        "subject": "Hello from cf workers",
        "content": [{
            "type": "text/plain",
            "value":"HELLO!"
        }]
    },
    "toAddr": [
        {"email":"EXAMPLE@EXAMPLE", "name": "EXAMPLE"}],
    "apiKey": "EXAMPLE"
}
```

Request type:
```
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
```

Deploy:  
```npx wrangler deploy```
  
Remember to login first if needed:  
```npx wrangler login```

Run the development locally:  
```npx wrangler dev```

Configuration
----
```
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
```
- `APIUser`: Keys of the config dictionary, basically an username, forms the path for the API, `/mailercfw/{APIUser}`
  - `apiKey`: password for the user
  - `allowedToDomain`: The usef is only allowed to send emails from these Domains
  - `allowedFromAddr`: The sender email address
  - `allowedFromName`: The name of the sender

```
type ApiKeyConfig = {
    apiKey: string;
    allowedToDomain: string[];
    allowedFromAddr: string;
    allowedFromName: string;
}
```

Prereqs
----
- Domain on Cloudflare
- Wrangler
- Node
- SPF Record: https://support.mailchannels.com/hc/en-us/articles/200262610-Set-up-SPF-Records  

----
Why
---
:thinking: Since mailchannel allows one to send email _from_ any domain, ~~one might start a mail as a service platform~~ this may be useful for students, i.e. me, to share an email feature for multiple projects.  

Think a student with a domain allowing other users to send emails from their projects as well without much configuration. Whether it will be filtered by spam reminds another story. Although testing from domain that one actually owns indicated they will not get filtered out. 
  
Helpful:  
https://support.mailchannels.com/hc/en-us/articles/4565898358413-Sending-Email-from-Cloudflare-Workers-using-MailChannels-Send-API    
