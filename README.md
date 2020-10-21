# Email Alias Manager (ses-email-forward-ui)

UI to manage [ses-email-forward](https://github.com/DanielMuller/ses-email-forward).

Built with [Quasar](https://quasar.dev/) and [AWS-Amplify](https://docs.amplify.aws/).

## Host & Run
### Prerequisites
* [ses-email-forward](https://github.com/DanielMuller/ses-email-forward) setup
* AWS Amplify: `npm -g @aws-amplify/cli`
* A clone of this repo

### Setup Amplify console
* Connect a new app using your clone
* Use _main_ branch
* Set environment variables:
  * LOCALE: _fr_ or _en-us_
  * TABLE_PREFIX: as defined by _ses-email-forward_
  * TABLE_REGION: as defined by _ses-email-forward_
* Configure a domain (if you don't want the default amplifyapp.com domain)
* Create a user in Cognito
* Add via CLI the domains he can manage:
  ```bash
  aws --profile <myProfile> --region <myRegion> \
  cognito-idp admin-update-user-attributes \
  --user-pool-id  <userPoolId> \
  --username <username> \
  --user-attributes Name="custom:domains",Value="domain1.com,domain2.com,domain3.com"
  ```

## Local development
### Prerequisites
* [ses-email-forward](https://github.com/DanielMuller/ses-email-forward) setup
* AWS Amplify: `npm -g @aws-amplify/cli`
* Quasar: `nom -g @quasar/cli`

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
LOCALE=en-us TABLE_PREFIX=email-forward TABLE_REGION=eu-west-1 quasar dev
```

### Build the app for production
```bash
LOCALE=en-us TABLE_PREFIX=email-forward TABLE_REGION=eu-west-1 quasar build
```
