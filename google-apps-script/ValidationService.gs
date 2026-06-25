/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: ValidationService.gs
 * ROLE: Data Integrity & Business Constraints Verification
 * AUTHOR: Senior Google Apps Script Platform Architect
 * ============================================================================
 */

var ValidationService = {
  /**
   * Validates a complete Order payload object against standard constraints.
   * @param {Object} p - Incoming order data payload.
   * @return {Object} An object containing boolean isValid and array of string errors.
   */
  validateOrder: function(p) {
    var errors = [];
    
    if (!p) {
      return { isValid: false, errors: ["Payload is empty"] };
    }

    // Required fields check
    if (!p.orderId || p.orderId.toString().trim() === "") {
      errors.push("orderId is required and cannot be empty");
    }
    
    if (!p.customerName || p.customerName.toString().trim() === "") {
      errors.push("customerName is required");
    }

    // Email validation
    if (p.email && p.email.toString().trim() !== "") {
      var emailVal = p.email.toString().trim();
      var emailRegex = new RegExp(CONFIG.VALIDATION.EMAIL_REGEXP);
      if (!emailRegex.test(emailVal)) {
        errors.push("Invalid email address format: '" + emailVal + "'");
      }
    } else {
      errors.push("Email address is required");
    }

    // Phone validation (BD regional prefix standards)
    if (p.phone && p.phone.toString().trim() !== "") {
      var phoneVal = p.phone.toString().trim();
      var phoneRegex = new RegExp(CONFIG.VALIDATION.PHONE_REGEXP);
      if (!phoneRegex.test(phoneVal)) {
        errors.push("Invalid mobile number (Must be a valid 11-digit BD carrier format): '" + phoneVal + "'");
      }
    } else {
      errors.push("Phone number is required");
    }

    // Post Code validation
    if (p.postalCode && p.postalCode.toString().trim() !== "") {
      var postalVal = p.postalCode.toString().trim();
      var postalRegex = new RegExp(CONFIG.VALIDATION.POSTAL_CODE_REGEXP);
      if (!postalRegex.test(postalVal)) {
        errors.push("Invalid postal code: '" + postalVal + "'");
      }
    }

    // Financial calculations validation
    if (p.grandTotal !== undefined && isNaN(Number(p.grandTotal))) {
      errors.push("Grand total must be a valid numeric representation");
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
};
