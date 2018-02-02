/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/
// This loads the environment variables from the .env file
require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var cognitiveservices = require("botbuilder-cognitiveservices");
var customQnAMakerTools = require('./CustomQnAMakerTools');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
 appId: process.env.MICROSOFT_APP_ID,
 appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */
var inMemoryStorage = builder.MemoryBotStorage();

//var tableName = 'botdata';
//var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
//var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
//var bot = new builder.UniversalBot(connector);
//bot.set('storage', tableStorage);

var hrqna = new cognitiveservices.QnAMakerRecognizer({
	knowledgeBaseId: '7a755a47-4241-4af4-96c2-11e9236c865f', 
	subscriptionKey: '326007f6c6b14c74b21330fb613251a1',top: 6});
	
var pmqna = new cognitiveservices.QnAMakerRecognizer({
	knowledgeBaseId: 'f2d4e990-91a7-4299-a2d9-e163d54189c8', 
	subscriptionKey: '326007f6c6b14c74b21330fb613251a1', top: 6});
	
// Add global LUIS recognizer to bot
var luisAppUrl = process.env.LUIS_APP_URL || 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/0a06f715-0853-41bb-8631-2aa55f673ba0?subscription-key=e87a662e0c0d43b4a85bd9fabc2a1e59&timezoneOffset=330&verbose=true&q=';
bot.recognizer(new builder.LuisRecognizer(luisAppUrl));

var bot = new builder.UniversalBot(connector, [
    function (session) {
		session.send('Hi, I am QBot! I specialize in Employee Assistance at Q3, and will be glad to assist you.');
		session.endDialog();
		setTimeout(function(){session.beginDialog('Conversation');},5*1000);
	}
]).set('storage', inMemoryStorage);

bot.dialog('Conversation', [
	function (session, args, next) {		
    console.log('waterfall step 1');
		builder.Prompts.choice(session, "What would you like to do?", "Ask a Question for HR|Ask a Question for PMO|Search for a Document", { listStyle: builder.ListStyle.button });
    	//next();
	},
    function (session, result, next) {
		
        console.log('waterfall step 2');
		if (!result.response) {
            // exhausted attemps and no selection, start over
            session.send('Ooops! Too many attemps :( But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
        }

        // on error, start over
        session.on('error', function (err) {
            session.send('Failed with message: %s', err.message);
            session.endDialog();
        });

        // continue on proper dialog
        var selection = session.dialogData.selection = result.response.entity;
        switch (selection) {
            case 'Ask a Question for HR':
				builder.Prompts.text(session, 'HR (Human Resources) has many policies in Q3. Which specific policy do you wish to know about?');
				break;
                //return session.beginDialog('hrqna');
            case 'Ask a Question for PMO':
				builder.Prompts.text(session, 'The PMO (Project Management Office) handles the framework of ongoing projects in Q3. What would you like to know about the PMO?');
				break;
                //return session.beginDialog('pmqna');
			case 'Search for a Document':
				builder.Prompts.text(session, 'Which document would you like to see?');
				break;
        }
		console.log('selection: '+ selection);
		next();
    },
	function (session, result) {
		console.log('waterfall step 3');
        var selection = session.dialogData.selection;
		session.userData.selection = session.dialogData.selection;
		
		console.log("selection: " + session.dialogData.selection);
		
		if (selection == 'Ask a Question for HR') {
			console.log('HR question');
			builder.IntentDialog({ recognizers: [hrqna] });
            session.beginDialog('HRQnA');
		}
		else if (selection == 'Ask a Question for PMO') {
			console.log('PMO question');
			builder.IntentDialog({ recognizers: [pmqna] });
            session.beginDialog('PMOQnA');
		}
		else if (selection == 'Search for a Document') {
			builder.LuisRecognizer.recognize(result.response, process.env.LUIS_APP_URL, function (err, intents, entities) {
				console.log(intents);
				console.log(intents[0].intent);
				console.log(entities);
				
				if (err) {
					console.log("Some error occurred in calling LUIS");
				}
				else if (intents[0].intent == 'DocumentSearch') {
					if (isEmptyObject(entities) || entities == null || entities == []) {
						console.log("no result");
						session.send("I apologize we don't have any documents related to that search parameter.");
						setTimeout(function(){session.endDialog();}, 3*1000);
						setTimeout(function(){session.beginDialog('DocSearchFallback');}, 5*1000);					
					}
					else {
						console.log('in DocSearch');
						//console.log(intents);
						console.log('---------------------------------------------------------------');
						console.log(entities);
						session.beginDialog('DocumentSearch', entities);
					}
				}
				else {
					console.log("no result");
					session.send("I apologize we don't have any documents related to that search parameter.");
					setTimeout(function(){session.endDialog();}, 3*1000);
					setTimeout(function(){session.beginDialog('DocSearchFallback');}, 5*1000);
				}
					
			});
		}
}
]).triggerAction({
	matches: [/i don't understand/i, /i don't know/i, /how can you help me/i, /how can you assist me/i, /back/i, /main menu/i, /Go back to Main Menu/i]
});

var customQnAMakerTools = new customQnAMakerTools.CustomQnAMakerTools();
bot.library(customQnAMakerTools.createLibrary());

var HRQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [hrqna],
    defaultMessage: "I don't have an answer to that right now, for more information you can email us at hr@q3tech.com\n Do you wish to start again?",
    qnaThreshold: 0.3,
    feedbackLib: customQnAMakerTools
});

var PMOQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [pmqna],
    defaultMessage: "I don't have an answer to that right now, for more information you can email us at pmo@q3tech.com\n Do you wish to start again?",
    qnaThreshold: 0.3,
    feedbackLib: customQnAMakerTools
});

// Override to also include the knowledgebase question with the answer on confident matches
HRQnAMakerDialog.respondFromQnAMakerResult = function(session, qnaMakerResult){
    var result = qnaMakerResult;
	console.log(result);
    var response = result.answers[0].answer;
	console.log("sending response HR");
	session.send("Please give me a moment to answer your query.");
    setTimeout(function(){session.send(response);},5*1000)
	session.endDialog();
	setTimeout(function(){session.beginDialog('HRFallback');},12*1000)
}

PMOQnAMakerDialog.respondFromQnAMakerResult = function(session, qnaMakerResult){
    var result = qnaMakerResult;
    var response = result.answers[0].answer;
	console.log("sending response PMO");
   session.send("Please give me a moment to answer your query.");
    setTimeout(function(){session.send(response);},5*1000)
	session.endDialog();
	setTimeout(function(){session.beginDialog('PMOFallback');},12*1000)
}

bot.dialog('HRQnA', HRQnAMakerDialog).triggerAction({
	matches: [/HR/i, /about HR/i]
});

bot.dialog('PMOQnA', PMOQnAMakerDialog).triggerAction({
	matches: [/PMO/i, /about PMO/i]
});

bot.dialog('DocumentSearch', require('./DocumentSearch')
)

bot.dialog('HRFallback', [
	function (session, args, next) {
	console.log("in HR Fallback")
		builder.Prompts.choice(session, "Can I interest you in any other information from HR?", "Yes|No", { listStyle: builder.ListStyle.button });
		next();			
    },
	function (session,result, next) {
		
		console.log('HR fallback response:' + result.response.entity);
		if (result.response) {
			if (result.response.entity == "Yes") {
				builder.Prompts.text(session, "Which policy would you like to know about next?");
				next();
			}
			else if (result.response.entity == "No") {
				//session.endDialog("Thank you for using the QBot - Employee Assistant. Hope to help you out again!");
				session.endDialog();
				setTimeout(function(){session.beginDialog('FinalConfirmation');},3*1000)
			}
		}
	},
	function (session, result, next) {
		builder.IntentDialog({ recognizers: [hrqna] });
        session.beginDialog('HRQnA');
	}
]);

bot.dialog('PMOFallback', [
	function (session, args, next) {
	console.log("in PMO Fallback")
		builder.Prompts.choice(session, "Can I interest you in any other information from PMO?", "Yes|No", { listStyle: builder.ListStyle.button });
		next();			
    },
	function (session,result, next) {
		
		console.log('PMO Fallback response:' + result.response.entity);
		if (result.response) {
			if (result.response.entity == "Yes") {
				builder.Prompts.text(session, "What would you like to know about next?");
				next();
			}
			else if (result.response.entity == "No") {
				//session.endDialog("Thank you for using the QBot - Employee Assistant. Hope to help you out again!");
				session.endDialog();
				setTimeout(function(){session.beginDialog('FinalConfirmation');},3*1000)
			}
		}
	},
	function (session, result, next) {
		builder.IntentDialog({ recognizers: [hrqna] });
        session.beginDialog('PMOQnA');
	}
]);

bot.dialog('DocSearchFallback', [
	function (session, args, next) {
	console.log("in DocSearch Fallback")
		builder.Prompts.choice(session, "Would you like to see any other document?", "Yes|No", { listStyle: builder.ListStyle.button });
		next();			
    },
	function (session,result, next) {
		
		console.log('DocSearch Fallback response:' + result.response.entity);
		if (result.response) {
			if (result.response.entity == "Yes") {
				builder.Prompts.text(session, "Which document would you like to see next?");
				next();
			}
			else if (result.response.entity == "No") {
				//session.endDialog("Thank you for using the QBot - Employee Assistant. Hope to help you out again!");
				session.endDialog();
				setTimeout(function(){session.beginDialog('FinalConfirmation');},3*1000)
			}
		}
	},
	function (session, result, next) {
		builder.LuisRecognizer.recognize(result.response, process.env.LUIS_APP_URL, function (err, intents, entities) {
				console.log(intents);
				console.log(intents[0].intent);
				//console.log(entities);
				
				if (err) {
					console.log("Some error occurred in calling LUIS");
				}
				else if (intents[0].intent == 'DocumentSearch') {
					console.log('in DocSearch');
					//console.log(intents);
					console.log('---------------------------------------------------------------');
					console.log(entities);

					session.beginDialog('DocumentSearch', entities);
				}
			});
	}
]);

bot.dialog('FinalConfirmation', [
	function (session, args, next) {
		console.log("in final confirmation")
		builder.Prompts.choice(session, "Have I been able to assist you with all your queries?", "Yes|No|Go back to Main Menu", { listStyle: builder.ListStyle.button });
		next();			
    },
	function (session,result, next) {
		
		console.log('final confirmation results:' + result.response.entity);
		if (result.response) {
			if (result.response.entity == "Yes") {
				session.endDialog("Thank you for using the QBot - Employee Assistant. Hope to help you out again!");
				session.endDialog();
			}
			else if (result.response.entity == "No") {
				session.send("I apologize for not being able to help you as per your expectations. Let me know your queries, doubts, or any feedback, so I can forward them to the concerned authority, and you'll hear back from us soon.")
				setTimeout(function(){builder.Prompts.text(session, 'What is your feedback?');},3*1000);
				setTimeout(function(){next();},5*1000);
			}
			else if (result.response.entity == "Go back to Main Menu") {
				session.endDialog();
				setTimeout(function(){session.beginDialog('Conversation');},3*1000);
				//session.beginDialog('/');
			}
		}
	},
	function (session, result, next) {
		if (result.response) {
			console.log('unanswered query: ' + result.response);
			session.send("Thank you for your feedback. You'll hear back from us soon.");
			setTimeout(function(){session.endDialog("Thank you for using the QBot - Employee Assistant. Hope to help you out again!");}, 3*1000);
			setTimeout(function(){session.endDialog();}, 5*1000);
		}
	}
]).triggerAction({
	matches: [/ok/i, /thank you/i, /thanks/i, /help/i, /done/i, /no/i, /stop/i]
});

bot.dialog('FallbackIntro', [
	function (session) {
		session.send('I am QBot. I specialize in Employee Assistance at Q3, and will be glad to assist you.');
		session.endDialog();
		setTimeout(function(){session.beginDialog('Conversation');},2*1000);
	}
]).triggerAction({
	matches: [/who are you/i, /what is this/i, /what are you/i]
});

function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}