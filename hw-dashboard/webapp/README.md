# Installing project
1. Clone the project to your local git repository
2. Run `npm install` in bash shell (CMD can be used instead of bash shell but is not recommended)
    * npm packages is used for compiling the project (via Grunt)
3. Run `grunt build:dev` to compile and concat all less files
4. [optional] Run `grunt:watch` to recompile css once any .less file is changed. Note: rerun the task if new .less file was added after running the task

# Setting en environment for running the project
Nginx server is used for static files

1. Install [nginx](https://www.nginx.com/)
2. Run nginx with the project's nginx.config `nginx.exe -c /path/to/webapp/nginx/nginx.conf -p /path/to/webapp/nginx`


#Conventions and rules on the project
Preferred IDE for web development on HW project is Webstorm.

1. Since we use JSHint for code quality control, set up Webstorm to use jshint config from package.json.
To do this go to Settings > Languages&Frameworks > JavaScript > Code Quality Tools > JSHint. Enable it and choose the default option.

2. One .js file for one entity (service, model, directive etc.)

3. Use dashes to separate words in file and folder names. Use lower case letters. `string-format.js, api-server.js etc.`
