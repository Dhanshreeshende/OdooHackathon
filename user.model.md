const supabase =require('../config/db');

const authorize =(requiredRole)=>{
    return async(req,resizeBy,next)=> {
        try {
            const userId=req.headers['user-id'];

            if(!userId) {
                return resizeBy.status(401).json({message : "Authentication required.Please provide a user-id."});
            }
            const {data:user,error} =await supabase
                .from('users')
                .select('role')
                .eq('id',userId)
                .single();
                if(error||!user){
                    return resizeBy.status(401).json({message:"User not found."});
                }

                if (user.role!==requiredRole){
                    return res.status(403).json({message:`Access Denied : This module is for ${requiredRole}s only.`});
                }

                req.user=user;
                next();
        } catch(err) {
            res.status(500).json({error:"err.message"});
        }
    };
};

module.exports=authorize;