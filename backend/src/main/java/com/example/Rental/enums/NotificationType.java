package com.example.Rental.enums;

public enum NotificationType {
    POST_APPROVED,
    POST_REJECTED,
    POST_EXPIRING,
    /** @deprecated Kept for backward compatibility with existing DB records. No longer created. */
    NEW_MESSAGE,
    REVIEW_APPROVED,
    REPORT_RESOLVED,
    ACCOUNT_APPROVED,
    ACCOUNT_BANNED,
    NEW_BILL,
    CONTRACT_CREATED,
    CONTRACT_SIGNED
}
