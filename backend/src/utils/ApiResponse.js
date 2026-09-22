class ApiResponse {
  static ok(message, data, pagination = null) {
    const response = {
      success: true,
      message: message || 'Success',
      data: data || null,
    };
    
    // ✅ Add pagination if provided
    if (pagination) {
      response.pagination = pagination;
    }
    
    return response;
  }

  static created(message, data) {
    return {
      success: true,
      message: message || 'Created successfully',
      data: data || null,
    };
  }

  static error(message, errors = []) {
    return {
      success: false,
      message: message || 'Something went wrong',
      errors: errors,
    };
  }
}

module.exports = ApiResponse;