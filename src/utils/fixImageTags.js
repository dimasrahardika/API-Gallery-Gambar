const sequelize = require('../config/database');
const Image = require('../models/image');

async function fixImageTags() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    console.log('Fetching all images...');
    const images = await Image.findAll();
    console.log(`Found ${images.length} images. Processing...`);
    
    let updatedCount = 0;
    
    for (const image of images) {
      try {
        // Get current tags
        let currentTags = image.tags;
        let needsUpdate = false;
        let newTags = currentTags;
        
        // Check if tags need processing
        if (typeof currentTags === 'string') {
          try {
            // Parse the string
            let parsedTags = JSON.parse(currentTags);
            
            // If parsedTags is an array, clean each tag (remove extra quotes)
            if (Array.isArray(parsedTags)) {
              newTags = parsedTags.map(tag => {
                if (typeof tag === 'string') {
                  // Remove any extra JSON-escaped quotes
                  return tag.replace(/^\\?"(.*)\\?"$/, '$1');
                }
                return tag;
              });
              needsUpdate = true;
            }
          } catch (parseError) {
            console.log(`Error parsing tags for image ${image.id}, setting to empty array:`, parseError.message);
            newTags = [];
            needsUpdate = true;
          }
        }
        
        // Update if needed
        if (needsUpdate) {
          console.log(`Updating tags for image ${image.id}`);
          console.log(`  Before: ${JSON.stringify(currentTags)}`);
          console.log(`  After:  ${JSON.stringify(newTags)}`);
          
          image.tags = newTags;
          await image.save();
          updatedCount++;
        }
      } catch (imageError) {
        console.error(`Error processing image ${image.id}:`, imageError);
      }
    }
    
    console.log(`Finished processing. Updated ${updatedCount} images.`);
    await sequelize.close();
  } catch (error) {
    console.error('Error fixing image tags:', error);
  }
}

// Run the function
fixImageTags();