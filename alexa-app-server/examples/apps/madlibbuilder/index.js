'use strict';
module.change_code = 1;
var _ = require('lodash');
var Skill = require('alexa-app');
var SkillService = new Skill.app('madlibbuilder');
var AWS = require('aws-sdk');

var madlibStories = require('./madlibStories.js');
var MyContainer = require('./my_container.js');
var MyMadlibContainer = null;
var MyMadlibClass = require('./my_madlib.js');
var currentGame = null;

// Setup dynamoDB
AWS.config.update({
    region: 'us-east-1',
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com'});
var docClient = new AWS.DynamoDB.DocumentClient();

// Define intents for madlibbuilder app.
SkillService.intent('AMAZON.HelpIntent', {}, 
    function(request, response) {
        var prompt = 'How may I help you?'
        response.say(prompt).shouldEndSession(false);
    });

SkillService.sessionEnded( 
    function(request, response) {
        console.log('SessionEnded called.');
    });

SkillService.launch(
    function(request, response) {

        var prompt = ' Welcome to Madlibs. ';

// Load madlib stories and containers

    MyMadlibContainer = new MyContainer('MyMadLibContainer');
    for (let iStory of madlibStories.MADLIBS) {
        var myTmpMadlib = new MyMadlibClass(iStory.name);
        myTmpMadlib.set_story_template(iStory);
        MyMadlibContainer.add_object(myTmpMadlib);
    }

// Check to see if user has previously stored unfinished madlib   

        var unfinished_madlib = false;

/*        var dbParams = {
            TableName : 'myMadlibDB',
            KeyConditionExpression: "userID = :currUserID",
            ExpressionAttributeValues: {":currUserID":"XYZ124"}
        };

        docClient.query(dbParams, function(err,data) {
            if (err) {
                console.log('Unable to query.  Error:', JSON.stringify(err,null,2));
            } else {
                console.log('Query succeeded.');
                data.Items.forEach(function(item) {
                    console.log(' -', item.madlibName);
                });
            }
        });
*/
        // If previous unfinished madlib exists, ask user if they want to continue
        // or start a new madlib
//        if (unfinished_madlib === true){
//            console.log('Unfinished madlib from previous session exists.');

//        } else {

              prompt+=  ' Here is the list of madlibs you can play. ';

              var name1 = 'madlib';
              var name1_temp = 'Summertime';
              prompt+= ' Just say, go ' + name1 + 
                  ' if you want to play the ' + name1 + ' madlib, or any other one from the list.'; 

              response.sessionObject.set('currentMadlib', name1_temp); 
              response.sessionObject.set('AppState', 'ChooseMadlib'); 
              response.say(prompt).shouldEndSession(false);
//        }

    });

SkillService.intent('FillIntent', {
    'slots': {},
    'utterances': ['Go Madlibs.', 'Go Madlib.'] 
    },
    function(request, response) {
        console.log('FillIntent: currentMadlib = ', request.sessionAttributes.currentMadlib);
        currentGame = MyMadlibContainer.get_object(request.sessionAttributes.currentMadlib);
        var prompt = 'Please give me one ' + currentGame.get_current_wordtype_spoken();
        response.say(prompt).shouldEndSession(false);
        response.sessionObject.set('AppState', 'FillingMadlib'); 
    });

SkillService.intent('WordIntent', {
    'slots': {'CURRENTWORD': 'AMAZON.LITERAL'},
    'utterances': ['{example|CURRENTWORD}'] 
    },
    function(request, response) {

        var currWord = request.slot('CURRENTWORD');
//        var currentGame = MyMadlibContainer.get_object(request.sessionAttributes.currentMadlib);
        
        currentGame.set_current_word(currWord);
        
        var currWordType = currentGame.get_current_wordtype_spoken();
        if (currWordType === null) {
            prompt = 'The madlib is filled out.  Do you want me to read it back? Say read back madlib.';
            response.sessionObject.set('AppState', 'DoneMadlib'); 
        } else {
            var prompt = 'Please give me one ' + currWordType;
        }
        response.say(prompt).shouldEndSession(false);
    });

SkillService.intent('ReadbackIntent', {
    'slots': {},
    'utterances': ['Read back Madlibs.', 'Read back Madlib.'] 
    }, 
    function(request, response) {
//        var currentGame = MyMadlibContainer.get_object(request.sessionAttributes.currentMadlib);
        var prompt = currentGame.get_story_spoken();
        response.say(prompt).shouldEndSession(true);
        response.sessionObject.set('AppState', 'End'); 
    });

SkillService.intent('PlayAgainIntent', {}, 
    function(request, response) {
        response.sessionObject.set('AppState', 'ChooseMadlib'); 
    });

SkillService.intent('EndGameIntent', {}, 
    function(request, response) {
        response.sessionObject.set('AppState', 'End'); 
    });

module.exports = SkillService;
