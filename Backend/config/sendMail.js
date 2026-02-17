import {createTransport} from "nodemailer";

const sendMail=async ({email,subject,html})=>{//we reciving
const transport=createTransport({
    host:"smtp.gmail.com", //simple mail transfer protocol
    port:465, //mail port
    auth:{
        user:process.env.SMTP_USER,
        pass:process.env.SMTP_PASSWORD,
    }
})

//send mail

await transport.sendMail({
    from:process.env.SMTP_USER,
    to:email,
    subject, //upr se
    html,
})
};

export default sendMail;

