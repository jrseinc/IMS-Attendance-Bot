const { Telegraf } = require('telegraf');
const Stage = require('telegraf/stage');
const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup')
const session = require('telegraf/session');
const mongoose = require('mongoose');
const IDMap = require('./Modules/idSchema');
const attendanceMap = require('./Modules/attendanceSchema');
const { createIndexes } = require('./Modules/idSchema');
const fetch = require("node-fetch");
const attendanceJsonFile = require('./attendance.json');

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser : true,  
	useUnifiedTopology: true }, function(error) { 
		if (error) { 
			console.log("Error!" + error); 
		}else{
			console.log("Atlas Database Status: " + mongoose.connection.readyState);
		}
});

const data = attendanceJsonFile.attendance;
//*********************************
//Place for helper Function of handlers

//function to get the current user attendance attendance
const myAttendance = async function(ctx){
	//check if the users chat id exist in the database
	console.log(ctx.chosenInlineResult);
    const chatID = ctx.chat.id;
		await IDMap.find({chatID : chatID })
		.then(data => {
			console.log(`chatID: ${chatID}, is trying to access attendance (self) of ${data[0].collegeID}`);
			getAttendance(ctx, data[0].collegeID.toUpperCase());
		})
		.catch(err=> {
			ctx.reply("Can't find any associated College ID. Please use /SetID for registering your college.");
			console.log("!!!CRASH 🔥: " + err.message);
		});
}

//function to save collegeID the the current user to the database
const saveData = function (target){
	//validate the college id in target before saving to database

	const filter = {chatID : target.chatID};
	const update = {collegeID : target.collegeID};

	IDMap.findOneAndUpdate(filter, update, {
		new: true,
		upsert: true
	}).then(result =>{
		console.log(result);
	});

	// 	const IDcontainer = new IDMap({
// 		_id: new mongoose.Types.ObjectId(),
// 		chatID : target.chatID,
// 		collegeID : target.collegeID
// 	}); 
// 	IDcontainer
// 	.save()
// 	.then(result => {
// 		console.log(result);	
// 	})
// 	.catch(err => {
// 		console.log(err);
// 	});
}

const assignEmoji = function(value){
	let emoji = '';

	if(value <= 40){
		emoji = '🔴';
	}else if(value > 40 && value <= 60){
		emoji = '🟡';
	}else if(value > 60){
		emoji = '🟢';
	}
	return emoji;
}


//function to get attendance for the user with provided target college ID
const getAttendance = function(ctx, targetCollegeID){

	attendanceMap.find({college_id : targetCollegeID})
	.then(data => {
		attendanceData = data[0];

		const overallAttendanceEmoji = assignEmoji(attendanceData.percentage);

		// console.log(attendanceData["attendances	"]);
		ctx.reply(`Trying to fetch data for ${targetCollegeID} 👨‍🚀`); 
		let introMsg = `Name: ${attendanceData.name}
		College ID: ${attendanceData.college_id}
		Roll Number: ${attendanceData.roll_number}\n			
		Total Classes: ${attendanceData.classes_total}
		Classes Attended: ${attendanceData.classes_total_attended}
		Overall Percentage: ${attendanceData.percentage}% ${overallAttendanceEmoji}\n

		Subject Wise Attendance\n\n`;

		let detailMsg = '';

		const subjectAttendanceList = attendanceData["attendances"];
		for(const item of subjectAttendanceList){
			let tempMsg = `${assignEmoji((item.attended_classes/item.total_classes)*100)} Subject Code: ${item.subject_id}
			Total Classes: ${item.total_classes}
			Attended: ${item.attended_classes}
			Percentage: ${((item.attended_classes/item.total_classes)*100).toFixed(2)}%\n\n`;
			detailMsg = detailMsg + tempMsg + " ";
		}
		introMsg = introMsg + detailMsg;
		ctx.reply(introMsg);
		}
	).catch(err =>{
		ctx.reply(`Woops! No record found for College ID: ~~${targetCollegeID}~~. 😖 Make sure you are entering correct College ID. To reset your default ID use /setID. If the problem still presist please contact the dev @jrseinc.`);
		console.log("!!!CRASH 🔥: " + err.message);
	})

};

//conversation block to store current user collegeID
//**here setID is the name of the wizard and setID_Enter is the way to enter the wizard block. This Wizard thing is not clear to me right now. 
//https://github.com/telegraf/telegraf/issues/705 this is the best tutorial that I could find.
const setID_StepHandler = new Composer();
setID_StepHandler.action('Yes', (ctx) => {
	ctx.wizard.next();
});
setID_StepHandler.action('No', (ctx) => {
	ctx.wizard.selectStep(0);
});

const setID = new WizardScene(
    'setID_Enter',
    (ctx) => {
        ctx.reply('Provide me your college ID 👨‍🚀.\nYour college ID may look like this 👉"A2017CSE5000"');
        ctx.wizard.state.IDData = {};
        return ctx.wizard.next();
    },
    (ctx) => {
		const collegeID = ctx.message.text;
		ctx.wizard.state.IDData.chatID = ctx.chat.id;
		ctx.wizard.state.IDData.collegeID = collegeID;
		ctx.reply(`Do you want to save ~<b><i>${collegeID}</i></b>~ as your default College ID?`, 
			Extra.HTML().markup((m) =>
			m.inlineKeyboard([
			m.callbackButton('👍', 'Yes'),
			m.callbackButton('👎', 'No')])));
		return ctx.wizard.next();	
	},
	setID_StepHandler,
	async (ctx) => {
		ctx.reply("Thank you your college id will be updated shortly 🚀");
		saveData({
			chatID : ctx.wizard.state.IDData.chatID,
			collegeID : ctx.wizard.state.IDData.collegeID
		}); 
		return ctx.scene.leave();
	}
);

//conversation block for getting someone else college ID

const getElseID = new WizardScene(
	'getElseId_Enter',
	(ctx) =>{
		ctx.reply("Enter the College ID of the desired student:");
		ctx.wizard.state.IDData =  {};
		return ctx.wizard.next();
	},
	async (ctx) => {
		collegeID = ctx.message.text;
		console.log(`chatID: ${ctx.chat.id}, is trying to access attendance (else) of ${collegeID}`);
		getAttendance(ctx, collegeID.toUpperCase());
		return ctx.scene.leave();
	}
	
);

//**************************************
//Place to declare the messages templates
const welcomeMsg = `I'm a bot, and I have power to do simple things like fetching your attendance from the College Portal 🎉.\n
🍙 /MyAttendance\n will fetch your attendance from the college portal\n
🍙 /ElseAttendance *College ID Here*\n will fetch the attendance for the ID provided in the querry`;


//****************************
//Place to handel all commands.
bot.use(session());

//this is the start (welcome) command
bot.start( ctx => { ctx.reply(welcomeMsg) });

//this is for the attendance of a the particular user
bot.command(['MyAttendance', 'myattendance'], (ctx) => myAttendance(ctx));

//this is for the attendance of a different student 
const getElseIDStage = new Stage([getElseID]);
bot.use(getElseIDStage.middleware());
bot.command(['ElseAttendance', 'elseattendance', 'elseAttendance'], (ctx) => {
	ctx.scene.enter('getElseId_Enter');
})

//this is for setting the ID of the current user
const setIDStage = new Stage([setID]);
bot.use(setIDStage.middleware());
bot.command(['SetID', 'setid', 'setID'], (ctx) => {
    ctx.scene.enter('setID_Enter');
});

bot.launch();