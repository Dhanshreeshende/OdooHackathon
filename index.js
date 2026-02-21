const supabase = require('../config/db');

exports.createTrip = async (req, res) => {
    try {
        const { vehicle_id, passengers, customer_id, start_date, location, distance_km } = req.body;

        const { data: vehicle, error: vError } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', vehicle_id)
            .single();

        if (vError || !vehicle) return res.status(404).json({ message: "Vehicle not found" });

        if (!vehicle.isAvailable) {
            return res.status(400).json({ message: "Selected vehicle is not available" });
        }

        if (passengers > vehicle.allowed_passengers) {
            return res.status(400).json({ message: `Vehicle capacity exceeded. Max: ${vehicle.allowed_passengers}` });
        }

        const { data: trip, error: tError } = await supabase
            .from('trips')
            .insert([{ 
                vehicle_id, 
                passengers, 
                customer_id, 
                start_date, 
                location, 
                distance_km, 
                isCompleted: false 
            }])
            .select();

        if (tError) throw tError;

        await supabase
            .from('vehicles')
            .update({ isAvailable: false })
            .eq('id', vehicle_id);

        res.status(201).json({ message: "Trip created successfully", trip });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.endTrip = async (req, res) => {
    try {
        const { tripId } = req.params;

        const { data: trip, error: tError } = await supabase
            .from('trips')
            .select('*, vehicles(rate_per_km)')
            .eq('id', tripId)
            .single();

        if (tError || !trip) return res.status(404).json({ message: "Trip not found" });

        const tripCost = trip.distance_km * trip.vehicles.rate_per_km;

        await supabase
            .from('trips')
            .update({ isCompleted: true, tripCost: tripCost })
            .eq('id', tripId);

        await supabase
            .from('vehicles')
            .update({ isAvailable: true })
            .eq('id', trip.vehicle_id);

        res.status(200).json({ 
            message: "Trip ended successfully", 
            total_cost: tripCost 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTrip = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('trips')
            .select('*, users!customer_id(name), vehicles(*)')
            .eq('id', req.params.tripId)
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTrip = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('trips')
            .update(req.body)
            .eq('id', req.params.tripId);

        if (error) throw error;
        res.status(200).json({ message: "Trip updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteTrip = async (req, res) => {
    try {
        const { error } = await supabase
            .from('trips')
            .delete()
            .eq('id', req.params.tripId);

        if (error) throw error;
        res.status(200).json({ message: "Trip deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};