const supabase = require('../config/db');

exports.addVehicle = async(req,res)=> {
    try {
        const {name,registration_number,allowed_passengers,rate_per_km,owner_id}=req.body;

        const {data:user} =await supabase.from('users').select('role').eq('id',owner_id).single();
        if(!user || user.role !=='owner') {
            return res.status(403).json({message: "Access Denied : Only owners can create vehicles."});
        }
        const {data,error} =await supabase 
            .from('vehicles')
            .insert([{name,registration_number,allowed_passengers,rate_per_km,owner_id}])
            .select();

            if(error) throw error;

            res.status(201).json({message:"Vehicle added successfully",data});
    } catch (err) {
        res.status(500).json({error:err.message});
    }
};

exports.assignDriver =async(req,res)=> {
    try {
        const {vehicleId}= req.params;
        const {driver_id}= req.body;

        const {data,error}=await supabase 
            .from('vehicles')
            .update({driver_id})
            .eq('id',vehicleId);
        if(error) throw error;
        res.status(200).json({message:"Driver assigned successfully",data});
    } catch (err) {
        res.status(500).json({error:err.message});
    }
};

exports.getVehicle =async(req,res)=> {
    try {
        const {data,error}=await supabase 
            .from('vehicles')
            .select(`*,owner:users!owner_id(name),driver:users!driver_id(name)`)
            .eq('id',req.params.vehicleId)
            .single();
        if(error) throw error;
        res.status(200).json({data});
    } catch (err) {
        res.status(500).json({error:err.message});
    }
};