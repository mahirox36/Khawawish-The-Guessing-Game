from collections import Counter
import json
import os
from typing import Any, Dict, Literal, List, Set, Optional, Tuple
from rich import print
from pydantic import BaseModel, Field
import random
import logging

# Set up logging
logger = logging.getLogger(__name__)

class ObjectAttribute(BaseModel):
    """Represents a specific attribute of an object in the image."""
    name: str
    value: str
    confidence: float


class DetectedObject(BaseModel):
    """Represents an object detected in the image."""
    name: str
    confidence: float
    bounding_box: Optional[Tuple[float, float, float, float]] = None
    attributes: List[ObjectAttribute]
    description: Optional[str] = None

    def __str__(self) -> str:
        return f"{self.name} ({self.confidence:.2f})"


class Color(BaseModel):
    """Represents a color detected in the image."""
    name: str
    hex_code: Optional[str] = None
    prominence: float

    def __str__(self) -> str:
        return self.name


class TextElement(BaseModel):
    """Represents text detected in the image."""
    content: str
    confidence: float
    position: Optional[Tuple[float, float, float, float]] = None

    def __str__(self) -> str:
        return self.content


class ImageDescription(BaseModel):
    """Comprehensive description of an analyzed image."""
    summary: str
    tags: List[str]
    objects: List[DetectedObject]
    scene: str
    colors: List[Color]
    text_elements: Optional[List[TextElement]] = None
    time_of_day: Literal["Morning", "Afternoon", "Evening", "Night", "Unknown"]
    setting: Literal["Indoor", "Outdoor", "Unknown"]
    is_character: bool
    character_details: Optional[Dict[str, str]] = None
    image_quality: Literal["Low", "Medium", "High", "Unknown"]
    suggested_filename: Optional[str] = None
    image_path: str
    timestamp: str
    analysis_duration: float
    error: Optional[str] = None

    def get_dominant_colors(self, limit: int = 3) -> List[Color]:
        """Get the most dominant colors in the image."""
        return sorted(self.colors, key=lambda c: c.prominence, reverse=True)[:limit]

    def has_text(self) -> bool:
        """Check if the image contains any detected text."""
        return bool(self.text_elements)

    def get_text_content(self) -> str:
        """Get all text content concatenated."""
        if not self.text_elements:
            return ""
        return " ".join(t.content for t in self.text_elements)
    
    def get_key_attributes(self) -> Dict[str, Any]:
        """Get key attributes for comparison and filtering."""
        result = {
            "summary": self.summary,
            "scene": self.scene,
            "setting": self.setting,
            "time_of_day": self.time_of_day,
        }
        
        # Add character details if available
        if self.character_details:
            result["character"] = self.character_details.get("name", "Unknown")
            # Add other character attributes
            for key, value in self.character_details.items():
                if key != "name":
                    result[f"char_{key}"] = value
                    
        # Add dominant colors
        dom_colors = self.get_dominant_colors(2)
        if dom_colors:
            result["dom_color1"] = dom_colors[0].name
            if len(dom_colors) > 1:
                result["dom_color2"] = dom_colors[1].name
        
        return result


def load_image_data(data_file: str = "data/data.json") -> Dict[str, ImageDescription]:
    """Load and parse image data from JSON file."""
    try:
        with open(data_file, "r", encoding="utf-8") as f:
            data: Dict[str, Any] = json.load(f)
        
        # Parse and validate image data
        image_analysis = {}
        for image_name, image_data in data.items():
            try:
                image_analysis[image_name] = ImageDescription.model_validate_json(json.dumps(image_data))
            except Exception as e:
                logger.warning(f"Failed to parse data for image {image_name}: {e}")
                
        logger.info(f"Loaded {len(image_analysis)} images from {data_file}")
        return image_analysis
    except Exception as e:
        logger.error(f"Failed to load image data: {e}")
        return {}


def filter_images(images: Dict[str, ImageDescription]) -> Dict[str, ImageDescription]:
    """Filter images based on quality and required attributes."""
    original_count = len(images)
    filtered_images = images.copy()
    
    # Filter out images with errors
    for image_name, image_data in list(filtered_images.items()):
        if image_data.error:
            del filtered_images[image_name]
    
    # Filter out images with no objects
    for image_name, image_data in list(filtered_images.items()):
        if not image_data.objects:
            del filtered_images[image_name]
    
    # Filter out images with no colors
    for image_name, image_data in list(filtered_images.items()):
        if not image_data.colors:
            del filtered_images[image_name]
    
    # Filter out non-character images
    for image_name, image_data in list(filtered_images.items()):
        if not image_data.is_character:
            del filtered_images[image_name]
    
    # Filter out images with no character details
    for image_name, image_data in list(filtered_images.items()):
        if not image_data.character_details:
            del filtered_images[image_name]
    
    # Update file paths
    for image_name, image_data in filtered_images.items():
        filtered_images[image_name].image_path = f"static/images/{image_name}"
    
    # Filter out images that don't exist in the static/images folder
    for image_name, image_data in list(filtered_images.items()):
        if not os.path.exists(filtered_images[image_name].image_path):
            del filtered_images[image_name]
    
    logger.info(f"Filtered out {original_count - len(filtered_images)} images")
    logger.info(f"Remaining {len(filtered_images)} images after filtering")
    
    return filtered_images


def compute_character_attributes(image_data: Dict[str, ImageDescription]) -> Dict[str, Dict]:
    """Extract attributes from characters for selection algorithm."""
    character_attributes = {}
    
    for image_name, img_data in image_data.items():
        # Find character name
        char_name = None
        if img_data.character_details and "name" in img_data.character_details:
            char_name = img_data.character_details["name"]
        
        # Fallback to first object name
        if not char_name and img_data.objects:
            char_name = img_data.objects[0].name
        
        if char_name:
            # Collect attributes from different sources
            attrs = set()
            
            # 1. Object attributes
            for obj in img_data.objects:
                for attr in obj.attributes:
                    attrs.add(f"{attr.name}:{attr.value}")
            
            # 2. Character details
            if img_data.character_details:
                for key, value in img_data.character_details.items():
                    if key != "name":
                        attrs.add(f"character_{key}:{value}")
            
            # 3. Scene information
            attrs.add(f"scene:{img_data.scene}")
            attrs.add(f"setting:{img_data.setting}")
            attrs.add(f"time_of_day:{img_data.time_of_day}")
            
            # 4. Dominant colors
            for color in img_data.get_dominant_colors(2):
                attrs.add(f"color:{color.name}")
            
            # Store character with attributes
            character_attributes[image_name] = {
                "name": char_name,
                "attributes": attrs,
                "image_data": img_data
            }
    
    return character_attributes


def select_balanced_characters(num_characters: int, image_data: Dict[str, ImageDescription]) -> List[ImageDescription]:
    """
    Select a balanced subset of characters for the guessing game.
    
    Args:
        num_characters: Number of characters to select
        image_data: Dictionary of image analysis data
        
    Returns:
        List of ImageDescription objects that provides a balanced gameplay experience
    """
    if num_characters <= 0 or not image_data:
        logger.warning("No characters to select or invalid number requested")
        return []
    
    # Extract character attributes
    character_attributes = compute_character_attributes(image_data)
    
    # Group characters by name to handle duplicates
    character_groups = {}
    for image_name, char_info in character_attributes.items():
        char_name = char_info["name"]
        if char_name not in character_groups:
            character_groups[char_name] = []
        character_groups[char_name].append(image_name)
    
    # Select characters with diverse attributes
    selected = []
    remaining_chars = list(character_groups.keys())
    
    # Ensure we have enough characters
    if len(remaining_chars) < num_characters:
        logger.warning(f"Only {len(remaining_chars)} unique characters available, requested {num_characters}")
        num_characters = len(remaining_chars)
    
    # Randomize initial order
    random.shuffle(remaining_chars)
    
    # Create attribute frequency counter
    attribute_counts = Counter()
    for char_info in character_attributes.values():
        for attr in char_info["attributes"]:
            attribute_counts[attr] += 1
    
    # Start with a character that has uncommon attributes
    if remaining_chars:
        # Score characters by attribute rarity
        char_scores = {}
        for char_name in remaining_chars:
            char_images = character_groups[char_name]
            rep_image = char_images[0]
            
            # Calculate rarity score
            rarity_score = 0
            for attr in character_attributes[rep_image]["attributes"]:
                rarity_score += 1.0 / (attribute_counts[attr] + 1)
                
            char_scores[char_name] = rarity_score
        
        # Select first character with rare attributes
        first_pick = max(char_scores.items(), key=lambda x: x[1])[0]
        rep_image = character_groups[first_pick][0]
        selected.append(rep_image)
        remaining_chars.remove(first_pick)
    
    # Select remaining characters based on attribute diversity
    while len(selected) < num_characters and remaining_chars:
        # Calculate uniqueness scores
        char_scores = {}
        for char_name in remaining_chars:
            rep_image = character_groups[char_name][0]
            candidate_attrs = character_attributes[rep_image]["attributes"]
            
            # Calculate dissimilarity and rarity scores
            shared_attrs = 0
            total_comparisons = 0
            for selected_img in selected:
                selected_attrs = character_attributes[selected_img]["attributes"]
                shared = len(candidate_attrs.intersection(selected_attrs))
                shared_attrs += shared
                total_comparisons += len(selected_attrs)
            
            # Avoid division by zero
            if total_comparisons == 0 or len(candidate_attrs) == 0:
                dissimilarity = 1.0
            else:
                dissimilarity = 1.0 - (shared_attrs / (len(selected) * len(candidate_attrs)))
            
            # Rarity score
            rarity = sum(1.0 / (attribute_counts[attr] + 1) for attr in candidate_attrs)
            
            # Combined score (70% dissimilarity, 30% rarity)
            char_scores[char_name] = (0.7 * dissimilarity) + (0.3 * rarity)
        
        # Select character with highest score
        next_pick = max(char_scores.items(), key=lambda x: x[1])[0]
        rep_image = character_groups[next_pick][0]
        selected.append(rep_image)
        remaining_chars.remove(next_pick)
    
    # Return the selected ImageDescription objects
    logger.info(f"Selected {len(selected)} balanced characters")
    return [character_attributes[img]["image_data"] for img in selected]


# Load and filter image data
image_analysis = filter_images(load_image_data())

if __name__ == "__main__":
    # Example usage
    num_characters = 20  # Number of characters to select
    selected_characters = select_balanced_characters(num_characters, image_analysis)
    print(f"Selected {len(selected_characters)} characters out of {len(image_analysis)} available")
    
    # Print character names
    for i, character in enumerate(selected_characters, 1):
        if character.character_details and "name" in character.character_details:
            print(f"{i}. {character.character_details['name']} - {character.image_path}")
        else:
            print(f"{i}. Unknown - {character.image_path}")