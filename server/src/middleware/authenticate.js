const {verifyAccessToken}=require('../utils/jwt.js');
const AuthenticationError=require('../errors/AuthenticationError.js');
const authenticate=(req,res,next)=>{
    const authHeader=req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer')){
        return next(new AuthenticationError('Authentication required. Please provide a bearer token'));
    }
    const token =authHeader.split(' ')[1];
    try{
    const decoded=verifyAccessToken(token);
    req.user=decoded;
    next();
    }
    catch(error){
        return next(new AuthenticationError('Invalid or expired token'));
    }
}
module.exports=authenticate;
