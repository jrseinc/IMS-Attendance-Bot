const { Telegraf } = require('telegraf');
const Stage = require('telegraf/stage');
const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const session = require('telegraf/session');

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN)

let Data = [];


//*********************************
//Place for helper Function for handlers

//function to get the current user attendance attendance
const myAttendance = function(ctx){
    //check if the users chat id exist in the database
    const chatID = ctx.chat.id;
    if(chatID in Data){
        
    }else{
        ctx.reply("Unfortunately we don't have your College ID in our database. Don't worry use /SetID to set your ID, and we will remember it for you form now on. You can reuse it anytime to make a change 👩‍🚀.");
    }
}

//function to store current user attendance
//**here setID is the name of the wizard and setID_Enter is the way to enter the wizard block. This Wizard thing is not clear to me right now. 
//https://github.com/telegraf/telegraf/issues/705 this is the best tutorial that I could find.
const setID = new WizardScene(
    'setID_Enter',
    (ctx) => {
        ctx.reply("inside wizard wating for college id");
        ctx.wizard.state.IDData = {};
        return ctx.wizard.next();
    },
    (ctx) => {
        //perform some validation here. If the validation fails, use return; to get back to the same state and wait for the user to reinput it again

        //if the validation passes store it into the database (async) and leave the conversation using --return ctx.scene.leave();
    }
);

//**************************************
//Place to declare the messages templates
const welcomeMsg = `I'm a bot, and I have power to do simple things like fetching your attendance from the College Portal 🎉.\n
🍙 /MyAttendance\n will fetch your attendance from the college portal\n
🍙 /ElseAttendance *College ID Here*\n will fetch the attendance for the ID provided in the querry`;


//****************************
//Place to handel all commands.

//this is the start (welcome) command
bot.start( ctx => { ctx.reply(welcomeMsg) });
//this is for the attendance of a the particular user
bot.command(['MyAttendance', 'myattendance'], (ctx) => myAttendance(ctx));
//this is for setting the ID of the current user
const setIDStage = new Stage([setID]);
bot.use(session());
bot.use(setIDStage.middleware());

bot.command(['SetID', 'setid'], (ctx) => {
    ctx.reply('Provide me your college ID 👨‍🚀.\nYour college ID may look like this 👉"A2017CSE5000"');
    ctx.scene.enter('setID_Enter');
});

bot.launch()