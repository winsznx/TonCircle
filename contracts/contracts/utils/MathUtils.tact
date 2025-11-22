/// Utility contract for safe mathematical operations
trait MathUtils {
    
    /// Safe addition with overflow check
    /// @param a First number
    /// @param b Second number
    /// @return Sum of a and b
    fun safeAdd(a: Int, b: Int): Int {
        let result: Int = a + b;
        // Check for overflow by verifying result is greater than or equal to inputs
        require(result >= a && result >= b, "Addition overflow");
        return result;
    }
    
    /// Safe subtraction with underflow check
    /// @param a First number
    /// @param b Second number
    /// @return Difference of a and b
    fun safeSubtract(a: Int, b: Int): Int {
        require(a >= b, "Subtraction underflow");
        return a - b;
    }
    
    /// Safe multiplication with overflow check
    /// @param a First number
    /// @param b Second number
    /// @return Product of a and b
    fun safeMultiply(a: Int, b: Int): Int {
        require(a != 0, "Multiplication by zero");
        let result: Int = a * b;
        require(result / a == b, "Multiplication overflow");
        return result;
    }
    
    /// Safe division with zero check
    /// @param a Dividend
    /// @param b Divisor
    /// @return Quotient of a divided by b
    fun safeDivide(a: Int, b: Int): Int {
        require(b != 0, "Division by zero");
        return a / b;
    }
    
    /// Calculates percentage of an amount
    /// @param amount The base amount
    /// @param percentage The percentage (0-100)
    /// @return Percentage of the amount
    fun calculatePercentage(amount: Int, percentage: Int): Int {
        require(percentage >= 0 && percentage <= 100, "Percentage must be between 0 and 100");
        return self.safeDivide(self.safeMultiply(amount, percentage), 100);
    }
    
    /// Calculates minimum of two numbers
    /// @param a First number
    /// @param b Second number
    /// @return Minimum of a and b
    fun min(a: Int, b: Int): Int {
        return a < b ? a : b;
    }
    
    /// Calculates maximum of two numbers
    /// @param a First number
    /// @param b Second number
    /// @return Maximum of a and b
    fun max(a: Int, b: Int): Int {
        return a > b ? a : b;
    }
    
    /// Checks if a number is within range (inclusive)
    /// @param value The value to check
    /// @param min Minimum value
    /// @param max Maximum value
    /// @return true if within range, false otherwise
    fun isInRange(value: Int, min: Int, max: Int): Bool {
        return value >= min && value <= max;
    }
    
    /// Calculates compound interest
    /// @param principal Initial amount
    /// @param rate Interest rate (as percentage)
    /// @param periods Number of periods
    /// @return Final amount after compound interest
    fun calculateCompoundInterest(principal: Int, rate: Int, periods: Int): Int {
        require(periods >= 0, "Periods must be non-negative");
        require(rate >= 0, "Rate must be non-negative");
        
        let rateDecimal: Int = self.safeDivide(rate, 100);
        let result: Int = principal;
        
        repeat(periods) {
            result = self.safeAdd(result, self.safeDivide(self.safeMultiply(result, rateDecimal), 100));
        }
        
        return result;
    }
    
    /// Rounds up to nearest multiple
    /// @param value The value to round
    /// @param multiple The multiple to round to
    /// @return Rounded up value
    fun roundUp(value: Int, multiple: Int): Int {
        require(multiple > 0, "Multiple must be positive");
        let remainder: Int = value % multiple;
        return remainder == 0 ? value : value + (multiple - remainder);
    }
}

/// Empty contract for trait compilation
contract MathUtilsContract with MathUtils {}