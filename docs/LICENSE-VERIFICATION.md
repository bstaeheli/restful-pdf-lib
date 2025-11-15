# License Verification

All dependencies use open-source licenses with permissive terms suitable for commercial use.

## Runtime Dependencies

| Package | Version | License | Type |
|---------|---------|---------|------|
| express | ^4.18.2 | MIT | Permissive |
| pdf-lib | ^1.17.1 | MIT | Permissive |
| multer | ^1.4.5-lts.1 | MIT | Permissive |

## Development Dependencies

| Package | Version | License | Type |
|---------|---------|---------|------|
| typescript | ^5.3.3 | Apache-2.0 | Permissive |
| jest | ^29.7.0 | MIT | Permissive |
| ts-jest | ^29.1.1 | MIT | Permissive |
| supertest | ^6.3.3 | MIT | Permissive |
| eslint | ^8.56.0 | MIT | Permissive |
| @typescript-eslint/* | ^6.17.0 | MIT | Permissive |

## License Summary

✅ **All dependencies verified** - All packages use either MIT or Apache-2.0 licenses:

### MIT License
- Most permissive open-source license
- Allows commercial use
- Allows modification and redistribution
- Requires attribution only
- No warranty provided

### Apache-2.0 License
- Similar to MIT with additional protections
- Includes explicit patent grant
- More detailed terms and conditions
- Allows commercial use
- Requires attribution

## Compliance

Both licenses are:
- Approved by Open Source Initiative (OSI)
- Suitable for commercial projects
- Compatible with proprietary software
- Widely used in enterprise environments

## Verification

To verify licenses in your installation:

```bash
# Install license checker
npm install -g license-checker

# Check all licenses
license-checker --summary
```

## Updates

Regularly check for dependency updates and license changes:

```bash
# Check for outdated packages
npm outdated

# Audit security and licenses
npm audit
```

---

*Last verified: November 15, 2025*
