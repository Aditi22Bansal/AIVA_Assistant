import sql from "../configs/db.js"


export const getUserCreations = async(req , res)=>{
    try {
        const {userId} = req.auth()

        const creations = await sql` SELECT * FROM creations WHERE user_id=${userId} order by created_at DESC`;
        res.json({success:true, creations});

    } catch (error) {
        res.json({success:false, message:error.message})
    }
}

export const getPublishedCreations = async(req , res)=>{
    try {
        if (!process.env.DATABASE_URL) {
            return res.json({
                success: false,
                message: "Database connection not configured. Please set DATABASE_URL environment variable."
            });
        }

        const creations = await sql` SELECT * FROM creations WHERE publish=true ORDER BY created_at DESC`;
        res.json({success:true, creations});

    } catch (error) {
        console.error("Error connecting to database:", error);
        res.json({
            success: false,
            message: `Database error: ${error.message || "Failed to connect to database. Please check your DATABASE_URL configuration."}`
        });
    }
}

export const toggleLikeCreations = async(req , res)=>{
    try {

        const {userId} = req.auth()
        const {id} = req.body


        const [creation] = await sql` SELECT * FROM creations WHERE id = ${id}`

        if(!creation)
        {
            return res.json({success:false, message: "Creation not found"})
        }

        const currentLikes = creation.likes;
        const userIdStr = userId.toString();
        let updatedLikes;
        let message;

        if(currentLikes.includes(userIdStr))
        {
            updatedLikes=currentLikes.filter((user)=> user!=userIdStr);
            message = 'Creation Unliked'
        }else {
            updatedLikes= [...currentLikes, userIdStr]
            message = 'Creation Liked'
        }

        const formattedArray = `{${updatedLikes.join(',')}}`

        await sql` UPDATE creations set likes=${formattedArray}::text[] where id= ${id}`;

        res.json({success:true, message});

    } catch (error) {
        res.json({success:false, message:error.message})
    }
}