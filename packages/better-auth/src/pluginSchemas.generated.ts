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
        },
        "alg": {
          "type": "string",
          "required": false
        },
        "crv": {
          "type": "string",
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
      },
      "indexes": [
        {
          "fields": [
            "deviceCode"
          ],
          "unique": true
        },
        {
          "fields": [
            "userCode"
          ],
          "unique": true
        }
      ]
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
        },
        "alg": {
          "type": "string",
          "required": false
        },
        "crv": {
          "type": "string",
          "required": false
        }
      }
    }
  },
  "oauthProvider": {
    "oauthClient": {
      "modelName": "oauthClient",
      "fields": {
        "clientId": {
          "type": "string",
          "unique": true,
          "required": true
        },
        "clientSecret": {
          "type": "string",
          "required": false
        },
        "clientDiscoveryId": {
          "type": "string",
          "required": false
        },
        "disabled": {
          "type": "boolean",
          "defaultValue": false,
          "required": false
        },
        "skipConsent": {
          "type": "boolean",
          "required": false
        },
        "enableEndSession": {
          "type": "boolean",
          "required": false
        },
        "subjectType": {
          "type": "string",
          "required": false
        },
        "scopes": {
          "type": "string[]",
          "required": false
        },
        "clientCredentialsScopes": {
          "type": "string[]",
          "required": false,
          "defaultValue": []
        },
        "userId": {
          "type": "string",
          "required": false,
          "references": {
            "model": "user",
            "field": "id"
          },
          "index": true
        },
        "createdAt": {
          "type": "date",
          "required": false
        },
        "updatedAt": {
          "type": "date",
          "required": false
        },
        "name": {
          "type": "string",
          "required": false
        },
        "uri": {
          "type": "string",
          "required": false
        },
        "icon": {
          "type": "string",
          "required": false
        },
        "contacts": {
          "type": "string[]",
          "required": false
        },
        "tos": {
          "type": "string",
          "required": false
        },
        "policy": {
          "type": "string",
          "required": false
        },
        "softwareId": {
          "type": "string",
          "required": false
        },
        "softwareVersion": {
          "type": "string",
          "required": false
        },
        "softwareStatement": {
          "type": "string",
          "required": false
        },
        "redirectUris": {
          "type": "string[]",
          "required": true
        },
        "postLogoutRedirectUris": {
          "type": "string[]",
          "required": false
        },
        "backchannelLogoutUri": {
          "type": "string",
          "required": false
        },
        "backchannelLogoutSessionRequired": {
          "type": "boolean",
          "required": false
        },
        "tokenEndpointAuthMethod": {
          "type": "string",
          "required": false
        },
        "applicationType": {
          "type": "string",
          "required": false
        },
        "jwks": {
          "type": "string",
          "required": false
        },
        "jwksUri": {
          "type": "string",
          "required": false
        },
        "grantTypes": {
          "type": "string[]",
          "required": false
        },
        "responseTypes": {
          "type": "string[]",
          "required": false
        },
        "requirePKCE": {
          "type": "boolean",
          "required": false
        },
        "dpopBoundAccessTokens": {
          "type": "boolean",
          "required": false,
          "defaultValue": false
        },
        "referenceId": {
          "type": "string",
          "required": false
        },
        "metadata": {
          "type": "json",
          "required": false
        }
      }
    },
    "oauthResource": {
      "modelName": "oauthResource",
      "fields": {
        "identifier": {
          "type": "string",
          "required": true,
          "unique": true
        },
        "name": {
          "type": "string",
          "required": true
        },
        "accessTokenTtl": {
          "type": "number",
          "required": false
        },
        "refreshTokenTtl": {
          "type": "number",
          "required": false
        },
        "signingAlgorithm": {
          "type": "string",
          "required": false
        },
        "signingKeyId": {
          "type": "string",
          "required": false
        },
        "allowedScopes": {
          "type": "string[]",
          "required": false
        },
        "customClaims": {
          "type": "json",
          "required": false
        },
        "dpopBoundAccessTokensRequired": {
          "type": "boolean",
          "required": false,
          "defaultValue": false
        },
        "disabled": {
          "type": "boolean",
          "required": false,
          "defaultValue": false
        },
        "createdAt": {
          "type": "date",
          "required": false
        },
        "updatedAt": {
          "type": "date",
          "required": false
        },
        "policyVersion": {
          "type": "number",
          "required": false,
          "defaultValue": 1
        },
        "metadata": {
          "type": "json",
          "required": false
        }
      }
    },
    "oauthClientResource": {
      "modelName": "oauthClientResource",
      "fields": {
        "clientId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "oauthClient",
            "field": "clientId",
            "onDelete": "cascade"
          },
          "index": true
        },
        "resourceId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "oauthResource",
            "field": "identifier",
            "onDelete": "cascade"
          },
          "index": true
        },
        "metadata": {
          "type": "json",
          "required": false
        },
        "createdAt": {
          "type": "date",
          "required": false
        }
      },
      "indexes": [
        {
          "fields": [
            "clientId",
            "resourceId"
          ],
          "unique": true
        }
      ]
    },
    "oauthRefreshToken": {
      "fields": {
        "token": {
          "type": "string",
          "required": true,
          "unique": true
        },
        "clientId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "oauthClient",
            "field": "clientId"
          },
          "index": true
        },
        "sessionId": {
          "type": "string",
          "required": false,
          "references": {
            "model": "session",
            "field": "id",
            "onDelete": "set null"
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
        "referenceId": {
          "type": "string",
          "required": false
        },
        "authorizationCodeId": {
          "type": "string",
          "required": false,
          "index": true
        },
        "resources": {
          "type": "string[]",
          "required": false
        },
        "requestedUserInfoClaims": {
          "type": "string[]",
          "required": false
        },
        "expiresAt": {
          "type": "date"
        },
        "createdAt": {
          "type": "date"
        },
        "revoked": {
          "type": "date",
          "required": false
        },
        "rotatedAt": {
          "type": "date",
          "required": false
        },
        "rotationReplayResponse": {
          "type": "string",
          "required": false
        },
        "rotationReplayExpiresAt": {
          "type": "date",
          "required": false
        },
        "authTime": {
          "type": "date",
          "required": false
        },
        "confirmation": {
          "type": "json",
          "required": false
        },
        "scopes": {
          "type": "string[]",
          "required": true
        }
      }
    },
    "oauthAccessToken": {
      "modelName": "oauthAccessToken",
      "fields": {
        "token": {
          "type": "string",
          "unique": true
        },
        "clientId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "oauthClient",
            "field": "clientId"
          },
          "index": true
        },
        "sessionId": {
          "type": "string",
          "required": false,
          "references": {
            "model": "session",
            "field": "id",
            "onDelete": "set null"
          },
          "index": true
        },
        "userId": {
          "type": "string",
          "required": false,
          "references": {
            "model": "user",
            "field": "id"
          },
          "index": true
        },
        "referenceId": {
          "type": "string",
          "required": false
        },
        "authorizationCodeId": {
          "type": "string",
          "required": false,
          "index": true
        },
        "resources": {
          "type": "string[]",
          "required": false
        },
        "requestedUserInfoClaims": {
          "type": "string[]",
          "required": false
        },
        "refreshId": {
          "type": "string",
          "required": false,
          "references": {
            "model": "oauthRefreshToken",
            "field": "id"
          },
          "index": true
        },
        "expiresAt": {
          "type": "date"
        },
        "createdAt": {
          "type": "date"
        },
        "revoked": {
          "type": "date",
          "required": false
        },
        "confirmation": {
          "type": "json",
          "required": false
        },
        "scopes": {
          "type": "string[]",
          "required": true
        }
      }
    },
    "oauthConsent": {
      "modelName": "oauthConsent",
      "fields": {
        "clientId": {
          "type": "string",
          "required": true,
          "references": {
            "model": "oauthClient",
            "field": "clientId"
          },
          "index": true
        },
        "userId": {
          "type": "string",
          "required": false,
          "references": {
            "model": "user",
            "field": "id"
          },
          "index": true
        },
        "referenceId": {
          "type": "string",
          "required": false
        },
        "resources": {
          "type": "string[]",
          "required": false
        },
        "requestedUserInfoClaims": {
          "type": "string[]",
          "required": false
        },
        "scopes": {
          "type": "string[]",
          "required": true
        },
        "createdAt": {
          "type": "date"
        },
        "updatedAt": {
          "type": "date"
        }
      }
    },
    "oauthClientAssertion": {
      "modelName": "oauthClientAssertion",
      "fields": {
        "expiresAt": {
          "type": "date",
          "required": true
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
        "memberCount": {
          "type": "number",
          "required": true,
          "defaultValue": 0,
          "input": false,
          "returned": false
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
        "membershipKey": {
          "type": "string",
          "required": false,
          "unique": true,
          "input": false,
          "returned": false
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
