# Changelog

All notable changes to the TeleCleaner project will be documented in this file.

## [Unreleased]

### Fixed - December 3, 2024 (Update 2)

#### 🐛 Calendar Not Showing on First Click
- **Fixed**: Calendar modal not appearing on first click of "Custom Date Range"
- **Cause**: Conditional rendering and state timing issue
- **Solution**: Always render DateRangePicker, control with visible prop
- **Impact**: Calendar now appears immediately on first click

#### 🐛 UI Unresponsive After Date Selection (Final Fix)
- **Fixed**: UI remaining unresponsive after custom date range confirmation
- **Cause**: Modal not closing explicitly, Alert shown during transition
- **Solution**: Explicit modal close, 300ms delay before Alert
- **Impact**: UI now fully responsive after date selection

### Fixed - December 3, 2024 (Update 1)

#### 🐛 App Unresponsive After Custom Date Selection
- **Fixed**: App becoming unclickable after selecting custom date range
- **Cause**: Modal nesting issue with DateRangePicker inside DeletionOptionsModal
- **Solution**: Close parent modal before opening date picker, add transition delay
- **Impact**: App now remains fully responsive after date selection

#### 🐛 Cannot Change Start Date After Selection
- **Fixed**: Users unable to reselect start date after choosing end date
- **Solution**: Added "↻ Change Start Date" button
- **Impact**: Users can now freely modify start date at any time

#### 🔧 State Management Improvements
- **Fixed**: Previous date selections persisting when reopening calendar
- **Solution**: Added useEffect to reset state when modal opens
- **Impact**: Clean slate every time calendar is opened

### Added - December 3, 2024

#### ✨ Custom Date Range Picker
- **New Feature**: Users can now select custom date ranges for message deletion
- Added interactive calendar view with month navigation
- Visual date range selection with start and end dates
- Highlights selected dates and date range in calendar
- Integrated into the deletion options modal
- Updated `lib/telegram.ts` to support custom date filtering

**Files Added:**
- `components/DateRangePicker.tsx` - Full calendar component with date range selection

**Files Modified:**
- `app/(tabs)/chats.tsx` - Added custom date range support
- `components/DeletionOptionsModal.tsx` - Added "Custom Date Range" option
- `lib/telegram.ts` - Updated `filterMessagesByTime()` to handle custom ranges

**How to Use:**
1. Select chats you want to clean
2. Tap "Delete Messages"
3. Choose "Custom Date Range"
4. Select start date in calendar
5. Select end date in calendar
6. Confirm to proceed with deletion

#### 🎯 Select All Chats Feature
- **New Feature**: One-click button to select/deselect all chats
- Button automatically toggles between "Select All" and "Deselect All"
- Visual checkmark (✓) when all chats are selected
- Positioned at the top of the chat list for easy access

**Files Modified:**
- `app/(tabs)/chats.tsx` - Added `selectAllChats()` and `deselectAllChats()` functions

**How to Use:**
1. Tap "Select All Chats" button at the top
2. All chats will be selected instantly
3. Button changes to "✓ Deselect All"
4. Tap again to deselect all chats

### Technical Details

#### Type Definitions
```typescript
export type DeletionOption = 'last_day' | 'last_week' | 'all' | 'custom';

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}
```

#### Calendar Features
- Month navigation (previous/next)
- Visual date range highlighting
- Start and end date display
- Responsive grid layout (7 columns for days of week)
- Automatic date swapping if end date is before start date
- Full month view with proper day alignment

#### UI/UX Improvements
- Telegram blue color scheme maintained
- Smooth modal transitions
- Clear visual feedback for selections
- Intuitive date picking flow
- Cancel and confirm actions

### Testing Notes

Both features are ready to test with:
```bash
npx expo start --tunnel
```

The features work with mock data. When Telegram API is integrated, the custom date range will filter actual messages between the selected dates.

---

## [1.0.0] - Initial Release

### Added
- Complete project structure with Expo + React Native
- Phone authentication flow
- Code verification screen
- Chat listing with multi-select
- Deletion options (last day, last week, all messages)
- Settings screen
- NativeWind (Tailwind CSS) styling
- TypeScript support
- Comprehensive documentation

### Components
- ChatListItem - Individual chat display
- DeletionOptionsModal - Time range selector
- DateRangePicker - Custom date range calendar

### Services
- Telegram API client (template)
- Supabase client setup

### Documentation
- README.md
- GET_STARTED.md
- QUICKSTART.md
- SETUP.md
- PROJECT_SUMMARY.md
- APP_FLOW.md
- TODO.md
- PROJECT_STRUCTURE.txt

---

## Future Enhancements

### Planned Features
- Real Telegram API integration
- Progress tracking for deletions
- Deletion history
- Chat search and filtering
- Dark mode
- Multi-language support
- Scheduled deletions
- Statistics dashboard

### Known Limitations
- Currently using mock data
- No real message deletion yet
- Requires Telegram API credentials
- Assets need to be created

---

**Version Format**: [Major.Minor.Patch]
- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes

**Last Updated**: December 3, 2024
