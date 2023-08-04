from urllib.request import urlopen, Request, HTTPError
import os, json

MAILERCFW_API_BASE_URL = 'https://mailercfw.readbean.workers.dev/mailercfw/'

def send_email(
        subject: str, message: str, email: str, name: str, 
        mailer_api_user: str=None, mailer_api_key: str=None, 
        use_env_var: bool=False, user_agent: str='Python mailer'):
    mailercfw_api_url = MAILERCFW_API_BASE_URL + mailer_api_user
    mailer_api_key = os.environ.get('MAILERCFW_API_KEY') if use_env_var else mailer_api_key

    email_request_data_json_str: str = json.dumps({
        "message": {
            "subject": f"{subject}",
            "content": [{
                "type": "text/html",
                "value": f"{message}"
            }]
        },
        "toAddr": [
            {"email": email, "name": name}],
        "apiKey": mailer_api_key 
    })

    req = Request(url=mailercfw_api_url, 
        data=email_request_data_json_str.encode('UTF-8'),
        headers={
            'Content-Type':'application/json',
            'User-Agent' : user_agent 
            },
        method='POST')

    try:
        resp = urlopen(req)
        if resp.status != 200 and resp.status != 202:
            raise Exception(f"{resp.status} - {resp.read()}")
        print(f'Success - {resp.status}\nResponse Body:')
        rep = resp.read()
        print(rep)
        return rep
    except HTTPError as e:
        print(e)
        print(e.read())
    except Exception as e:
        print(e)
