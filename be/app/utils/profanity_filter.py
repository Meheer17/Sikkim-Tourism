"""
Profanity filter for message moderation
"""
from typing import List, Tuple


class ProfanityFilter:
    """Filter inappropriate words from messages"""
    
    # List of offensive words to block (add more as needed)
    OFFENSIVE_WORDS = {
        # Common profanity
        "fuck", "shit", "bitch", "bastard", "crap",
        "piss", "dick", "cock", "pussy", "cunt", "whore", "slut", "fag",
        # Variations with special characters
        "f*ck", "sh*t", "b*tch", "a$$",
        # Add language-specific offensive words as needed
    }
    
    # Words that should be allowed even if they contain offensive substrings
    WHITELIST = {
        "assassin", "bass", "class", "grass", "pass", "glass", "mass",
        "classic", "assistant", "assignment", "assume", "assumption",
        "cassette", "compass", "harass", "embassy", "passionate",
        "hello", "shell", "hell", "bells", "yell", "sell", "tell", "well",
        "assess", "asset", "assess", "message", "passenger", "passage",
    }
    
    @classmethod
    def contains_profanity(cls, text: str) -> Tuple[bool, List[str]]:
        """
        Check if text contains offensive words
        
        Returns:
            Tuple of (has_profanity: bool, found_words: List[str])
        """
        if not text:
            return False, []
        
        # Normalize text - convert to lowercase and remove special chars for checking
        normalized = text.lower()
        
        # Remove punctuation that might be used to bypass filter
        chars_to_remove = "!@#$%^&*()_+-=[]{}|;:'\",.<>?/~`"
        for char in chars_to_remove:
            normalized = normalized.replace(char, "")
        
        # Split into words
        words = normalized.split()
        
        found_offensive = []
        
        # Check each word
        for word in words:
            # Skip whitelisted words
            if word in cls.WHITELIST:
                continue
            
            # Direct match only - more precise filtering
            if word in cls.OFFENSIVE_WORDS:
                found_offensive.append(word)
                continue
            
            # Check for exact offensive words with minor obfuscation (e.g., "f***" instead of substring matching)
            # Only flag if the word is very similar to an offensive word
            for offensive in cls.OFFENSIVE_WORDS:
                # Only match if word is offensive word with 1-2 extra chars or substitutions
                if len(word) == len(offensive) and word.replace('*', offensive[0]) == offensive:
                    found_offensive.append(word)
                    break
        
        return len(found_offensive) > 0, found_offensive
    
    @classmethod
    def is_clean(cls, text: str) -> bool:
        """
        Check if text is clean (no profanity)
        
        Returns:
            bool: True if text is clean, False if it contains profanity
        """
        has_profanity, _ = cls.contains_profanity(text)
        return not has_profanity
    
    @classmethod
    def get_violation_message(cls, found_words: List[str]) -> str:
        """
        Get a user-friendly message about the violation
        
        Args:
            found_words: List of offensive words found
            
        Returns:
            str: Message to show to user
        """
        if len(found_words) == 1:
            return "Your message contains inappropriate language. Please be respectful."
        else:
            return "Your message contains multiple instances of inappropriate language. Please be respectful."


# Singleton instance
profanity_filter = ProfanityFilter()
