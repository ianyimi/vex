// ⚠️ AUTO-GENERATED — DO NOT EDIT ⚠️
// Snapshot of every modelled Better Auth plugin's DB schema, harvested from
// the real plugin factories by `pluginSchemas.test.ts`. Regenerate after a
// Better Auth upgrade with `pnpm --filter @vexcms/better-auth gen:auth-schemas`;
// the same test fails when this file and the installed version disagree.
//
// It exists so `betterAuthCollections()` can run in a browser bundle: reading
// these schemas costs ~1 KB, instantiating the plugins that declare them costs
// ~154 KB gzipped.

import type { PluginDBSchema } from "./pluginSchemas";

/** Declared DB schema per plugin descriptor key. */
export const PLUGIN_SCHEMAS: Record<string, PluginDBSchema> = {
  "admin": {
    "user": {
      "fields": {
        "role": {
          "type": "string",
          "required": false,
          "input": false
        },
        "banned": {
          "type": "boolean",
          "defaultValue": false,
          "required": false,
          "input": false
        },
        "banReason": {
          "type": "string",
          "required": false,
          "input": false
        },
        "banExpires": {
          "type": "date",
          "required": false,
          "input": false
        }
      }
    },
    "session": {
      "fields": {
        "impersonatedBy": {
          "type": "string",
          "required": false,
          "input": false
        }
      }
    }
  },
  "anonymous": {
    "user": {
      "fields": {
        "isAnonymous": {
          "type": "boolean",
          "required": false,
          "input": false,
          "defaultValue": false
        }
      }
    }
  },
  "apiKey": {
    "apikey": {
      "fields": {
        "configId": {
          "type": "string",
          "required": true,
          "defaultValue": "default",
          "input": false,
          "index": true
        },
        "name": {
          "type": "string",
          "required": false,
          "input": false
        },
        "start": {
          "type": "string",
          "required": false,
          "input": false
        },
        "referenceId": {
          "type": "string",
          "required": true,
          "input": false,
          "index": true
        },
        "prefix": {
          "type": "string",
          "required": false,
          "input": false
        },
        "key": {
          "type": "string",
          "required": true,
          "input": false,
          "index": true
        },
        "refillInterval": {
          "type": "number",
          "required": false,
          "input": false
        },
        "refillAmount": {
          "type": "number",
          "required": false,
          "input": false
        },
        "lastRefillAt": {
          "type": "date",
          "required": false,
          "input": false
        },
        "enabled": {
          "type": "boolean",
          "required": false,
          "input": false,
          "defaultValue": true
        },
        "rateLimitEnabled": {
          "type": "boolean",
          "required": false,
          "input": false,
          "defaultValue": true
        },
        "rateLimitTimeWindow": {
          "type": "number",
          "required": false,
          "input": false,
          "defaultValue": 86400000
        },
        "rateLimitMax": {
          "type": "number",
          "required": false,
          "input": false,
          "defaultValue": 10
        },
        "requestCount": {
          "type": "number",
          "required": false,
          "input": false,
          "defaultValue": 0
        },
        "remaining": {
          "type": "number",
          "required": false,
          "input": false
        },
        "lastRequest": {
          "type": "date",
          "required": false,
          "input": false
        },
        "expiresAt": {
          "type": "date",
          "required": false,
          "input": false
        },
        "createdAt": {
          "type": "date",
          "required": true,
          "input": false
        },
        "updatedAt": {
          "type": "date",
          "required": true,
          "input": false
        },
        "permissions": {
          "type": "string",
          "required": false,
          "input": false
        },
        "metadata": {
          "type": "string",
          "required": false,
          "input": true,
          "transform": {}
        }
      }
    }
  },
  "convex": {
    "user": {
      "fields": {
        "userId": {
          "type": "string",
          "required": false,
          "input": false
        }
      }
    },
    "jwks": {
      "fields": {
        "publicKey": {
          "type": "string",
          "required": true
        },
        "privateKey": {
          "type": "string",
          "required": true
        },
        "createdAt": {
          "type": "date",
          "required": true
        },
        "expiresAt": {
          "type": "date",
          "required": false
        }
      }
    }
  },
  "deviceAuthorization": {
    "deviceCode": {
      "fields": {
        "deviceCode": {
          "type": "string",
          "required": true
        },
        "userCode": {
          "type": "string",
          "required": true
        },
        "userId": {
          "type": "string",
          "required": false
        },
        "expiresAt": {
          "type": "date",
          "required": true
        },
        "status": {
          "type": "string",
          "required": true
        },
        "lastPolledAt": {
          "type": "date",
          "required": false
        },
        "pollingInterval": {
          "type": "number",
          "required": false
        },
        "clientId": {
          "type": "string",
          "required": false
        },
        "scope": {
          "type": "string",
          "required": false
        }
      }
    }
  },
  "jwt": {
    "jwks": {
      "fields": {
        "publicKey": {
          "type": "string",
          "required": true
        },
        "privateKey": {
          "type": "string",
          "required": true
        },
        "createdAt": {
          "type": "date",
          "required": true
        },
        "expiresAt": {
          "type": "date",
          "required": false
        }
      }
    }
  },
  "mcp": {
    "oauthApplication": {
      "modelName": "oauthApplication",
      "fields": {
        "name": {
          "type": "string"
        },
        "icon": {
          "type": "string",
          "required": false
        },
        "metadata": {
          "type": "string",
          "required": false
        },
        "clientId": {
          "type": "string",
          "unique": true
        },
        "clientSecret": {
          "type": "string",
          "required": false
        },
        "redirectUrls": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "disabled": {
          "type": "boolean",
          "required": false,
          "defaultValue": false
        },
        "userId": {
          "type": "string",
          "required": false,
          "references": {
            "model": "user",
            "field": "id",
            "onDelete": "cascade"
          },
          "index": true
        },
        "createdAt": {
          "type": "date"
        },
        "updatedAt": {
          "type": "date"
        }
      }
    },
    "oauthAccessToken": {
      "modelName": "oauthAccessToken",
      "fields": {
        "accessToken": {
          "type": "string",
          "unique": true
        },
        "refreshToken": {
          "type": "string",
          "unique": true
        },
        "accessTokenExpiresAt": {
          "type": "date"
        },
        "refreshTokenExpiresAt": {
          "type": "date"
        },
        "clientId": {
          "type": "string",
          "references": {
            "model": "oauthApplication",
            "field": "clientId",
            "onDelete": "cascade"
          },
          "index": true
        },
        "userId": {
          "type": "string",
          "required": false,
          "references": {
            "model": "user",
            "field": "id",
            "onDelete": "cascade"
          },
          "index": true
        },
        "scopes": {
          "type": "string"
        },
        "createdAt": {
          "type": "date"
        },
        "updatedAt": {
          "type": "date"
        }
      }
    },
    "oauthConsent": {
      "modelName": "oauthConsent",
      "fields": {
        "clientId": {
          "type": "string",
          "references": {
            "model": "oauthApplication",
            "field": "clientId",
            "onDelete": "cascade"
          },
          "index": true
        },
        "userId": {
          "type": "string",
          "references": {
            "model": "user",
            "field": "id",
            "onDelete": "cascade"
          },
          "index": true
        },
        "scopes": {
          "type": "string"
        },
        "createdAt": {
          "type": "date"
        },
        "updatedAt": {
          "type": "date"
        },
        "consentGiven": {
          "type": "boolean"
        }
      }
    }
  },
  "oidcProvider": {
    "oauthApplication": {
      "modelName": "oauthApplication",
      "fields": {
        "name": {
          "type": "string"
        },
        "icon": {
          "type": "string",
          "required": false
        },
        "metadata": {
          "type": "string",
          "required": false
        },
        "clientId": {
          "type": "string",
          "unique": true
        },
        "clientSecret": {
          "type": "string",
          "required": false
        },
        "redirectUrls": {
          "type": "string"
        },
        "type": {
          "type": "string"
        },
        "disabled": {
          "type": "boolean",
          "required": false,
          "defaultValue": false
        },
        "userId": {
          "type": "string",
          "required": false,
          "references": {
            "model": "user",
            "field": "id",
            "onDelete": "cascade"
          },
          "index": true
        },
        "createdAt": {
          "type": "date"
        },
        "updatedAt": {
          "type": "date"
        }
      }
    },
    "oauthAccessToken": {
      "modelName": "oauthAccessToken",
      "fields": {
        "accessToken": {
          "type": "string",
          "unique": true
        },
        "refreshToken": {
          "type": "string",
          "unique": true
        },
        "accessTokenExpiresAt": {
          "type": "date"
        },
        "refreshTokenExpiresAt": {
          "type": "date"
        },
        "clientId": {
          "type": "string",
          "references": {
            "model": "oauthApplication",
            "field": "clientId",
            "onDelete": "cascade"
          },
          "index": true
        },
        "userId": {
          "type": "string",
          "required": false,
          "references": {
            "model": "user",
            "field": "id",
            "onDelete": "cascade"
          },
          "index": true
        },
        "scopes": {
          "type": "string"
        },
        "createdAt": {
          "type": "date"
        },
        "updatedAt": {
          "type": "date"
        }
      }
    },
    "oauthConsent": {
      "modelName": "oauthConsent",
      "fields": {
        "clientId": {
          "type": "string",
          "references": {
            "model": "oauthApplication",
            "field": "clientId",
            "onDelete": "cascade"
          },
          "index": true
        },
        "userId": {
          "type": "string",
          "references": {
            "model": "user",
            "field": "id",
            "onDelete": "cascade"
          },
          "index": true
        },
        "scopes": {
          "type": "string"
        },
        "createdAt": {
          "type": "date"
        },
        "updatedAt": {
          "type": "date"
        },
        "consentGiven": {
          "type": "boolean"
        }
      }
    }
  },
  "organization": {
    "organization": {
      "fields": {
        "name": {
          "type": "string",
          "required": true,
          "sortable": true
        },
        "slug": {
          "type": "string",
          "required": true,
          "unique": true,
          "sortable": true,
          "index": true
        },
        "logo": {
          "type": "string",
          "required": false
        },
        "createdAt": {
          "type": "date",
          "required": true
        },
        "metadata": {
          "type": "string",
          "required": false
        }
      }
    },
    "member": {
      "fields": {
        "organizationId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "organization",
            "field": "id"
          },
          "index": true
        },
        "userId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "user",
            "field": "id"
          },
          "index": true
        },
        "role": {
          "type": "string",
          "required": true,
          "sortable": true,
          "defaultValue": "member"
        },
        "createdAt": {
          "type": "date",
          "required": true
        }
      }
    },
    "invitation": {
      "fields": {
        "organizationId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "organization",
            "field": "id"
          },
          "index": true
        },
        "email": {
          "type": "string",
          "required": true,
          "sortable": true,
          "index": true
        },
        "role": {
          "type": "string",
          "required": false,
          "sortable": true
        },
        "status": {
          "type": "string",
          "required": true,
          "sortable": true,
          "defaultValue": "pending"
        },
        "expiresAt": {
          "type": "date",
          "required": true
        },
        "createdAt": {
          "type": "date",
          "required": true
        },
        "inviterId": {
          "type": "string",
          "references": {
            "model": "user",
            "field": "id"
          },
          "required": true
        }
      }
    },
    "session": {
      "fields": {
        "activeOrganizationId": {
          "type": "string",
          "required": false,
          "input": false
        }
      }
    }
  },
  "organization.teams": {
    "organization": {
      "fields": {
        "name": {
          "type": "string",
          "required": true,
          "sortable": true
        },
        "slug": {
          "type": "string",
          "required": true,
          "unique": true,
          "sortable": true,
          "index": true
        },
        "logo": {
          "type": "string",
          "required": false
        },
        "createdAt": {
          "type": "date",
          "required": true
        },
        "metadata": {
          "type": "string",
          "required": false
        }
      }
    },
    "team": {
      "fields": {
        "name": {
          "type": "string",
          "required": true
        },
        "organizationId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "organization",
            "field": "id"
          },
          "index": true
        },
        "createdAt": {
          "type": "date",
          "required": true
        },
        "updatedAt": {
          "type": "date",
          "required": false
        }
      }
    },
    "teamMember": {
      "fields": {
        "teamId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "team",
            "field": "id"
          },
          "index": true
        },
        "userId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "user",
            "field": "id"
          },
          "index": true
        },
        "createdAt": {
          "type": "date",
          "required": false
        }
      }
    },
    "member": {
      "fields": {
        "organizationId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "organization",
            "field": "id"
          },
          "index": true
        },
        "userId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "user",
            "field": "id"
          },
          "index": true
        },
        "role": {
          "type": "string",
          "required": true,
          "sortable": true,
          "defaultValue": "member"
        },
        "createdAt": {
          "type": "date",
          "required": true
        }
      }
    },
    "invitation": {
      "fields": {
        "organizationId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "organization",
            "field": "id"
          },
          "index": true
        },
        "email": {
          "type": "string",
          "required": true,
          "sortable": true,
          "index": true
        },
        "role": {
          "type": "string",
          "required": false,
          "sortable": true
        },
        "teamId": {
          "type": "string",
          "required": false,
          "sortable": true
        },
        "status": {
          "type": "string",
          "required": true,
          "sortable": true,
          "defaultValue": "pending"
        },
        "expiresAt": {
          "type": "date",
          "required": true
        },
        "createdAt": {
          "type": "date",
          "required": true
        },
        "inviterId": {
          "type": "string",
          "references": {
            "model": "user",
            "field": "id"
          },
          "required": true
        }
      }
    },
    "session": {
      "fields": {
        "activeOrganizationId": {
          "type": "string",
          "required": false,
          "input": false
        },
        "activeTeamId": {
          "type": "string",
          "required": false,
          "input": false
        }
      }
    }
  },
  "phoneNumber": {
    "user": {
      "fields": {
        "phoneNumber": {
          "type": "string",
          "required": false,
          "unique": true,
          "sortable": true,
          "returned": true
        },
        "phoneNumberVerified": {
          "type": "boolean",
          "required": false,
          "returned": true,
          "input": false
        }
      }
    }
  },
  "siwe": {
    "walletAddress": {
      "fields": {
        "userId": {
          "type": "string",
          "references": {
            "model": "user",
            "field": "id"
          },
          "required": true,
          "index": true
        },
        "address": {
          "type": "string",
          "required": true
        },
        "chainId": {
          "type": "number",
          "required": true
        },
        "isPrimary": {
          "type": "boolean",
          "defaultValue": false
        },
        "createdAt": {
          "type": "date",
          "required": true
        }
      }
    }
  },
  "twoFactor": {
    "user": {
      "fields": {
        "twoFactorEnabled": {
          "type": "boolean",
          "required": false,
          "defaultValue": false,
          "input": false
        }
      }
    },
    "twoFactor": {
      "fields": {
        "secret": {
          "type": "string",
          "required": true,
          "returned": false,
          "index": true
        },
        "backupCodes": {
          "type": "string",
          "required": true,
          "returned": false
        },
        "userId": {
          "type": "string",
          "required": true,
          "returned": false,
          "references": {
            "model": "user",
            "field": "id"
          },
          "index": true
        },
        "verified": {
          "type": "boolean",
          "required": false,
          "defaultValue": true,
          "input": false
        },
        "failedVerificationCount": {
          "type": "number",
          "required": false,
          "defaultValue": 0,
          "input": false,
          "returned": false
        },
        "lockedUntil": {
          "type": "date",
          "required": false,
          "input": false,
          "returned": false
        }
      }
    }
  }
};
