const supabase = require('../config/db');

exports.getAnalytics = async (req, res) => {
    try {
       
        const [
            customerCount,
            ownerCount,
            driverCount,
            vehicleCount,
            tripCount
        ] = await Promise.all([

            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
            
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'owner'),
            
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'driver'),
            
            supabase.from('vehicles').select('*', { count: 'exact', head: true }),
            
            supabase.from('trips').select('*', { count: 'exact', head: true })
        ]);

        const errors = [customerCount, ownerCount, driverCount, vehicleCount, tripCount].filter(res => res.error);
        if (errors.length > 0) {
            throw new Error("One or more analytics queries failed.");
        }

        res.status(200).json({
            total_customers: customerCount.count,
            total_owners: ownerCount.count,
            total_drivers: driverCount.count,
            total_vehicles: vehicleCount.count,
            total_trips: tripCount.count
        });

    } catch (err) {
        res.status(500).json({ 
            error: "Failed to fetch analytics", 
            message: err.message 
        });
    }
};