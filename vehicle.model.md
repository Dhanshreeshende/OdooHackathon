const fs=require('fs');
const loggerMiddleware=(req,res,next)=>{
    const logData=`${req.method} | ${req.url} | ${new Date().toISOString()}\n`;

    fs.appendFile('logs.txt',logData,(err)=> {
        if(err){
            console.error('Failed to write log file :', err);
        }
    });
    next();
};

module.exports=loggerMiddleware;