# Plan Tracking Modes

This feature adds two options for tracking expense plans:

## 1. Automatic Tracking (Default)
Automatically tracks plan items by monitoring transaction categories. When you add transactions to a category, the plan automatically shows the actual amount spent.

**Best for:**
- Regular expenses with frequent transactions
- Categories where you want real-time spending tracking
- Budget items that should match actual spending

**How it works:**
- Select "Automatic (via transactions)" when creating/editing a plan item
- Add transactions to the category throughout the month
- The plan automatically calculates actual spending from transactions
- Progress bars and totals update in real-time

## 2. Manual Tracking
Manually check off plan items as done or partially done, regardless of whether transactions have been recorded.

**Best for:**
- One-time payments or bills
- Planned expenses that might not show up as transactions yet
- Items you want to mark complete independently of transactions
- Bills paid outside the system (cash, other accounts)

**How it works:**
- Select "Manual (check off as done)" when creating/editing a plan item
- Use quick action buttons to set completion: 0%, 25%, 50%, 75%, 100%
- Visual progress bar shows current completion status
- Or use the checkbox for quick 100% completion toggle
- Or edit the item to set a custom completion amount

## Features

### Creating Plan Items
1. Click "Add Plan Item" button
2. Select an expense category
3. Enter the planned amount
4. Set a due date (optional)
5. **Choose tracking mode:**
   - **Automatic**: Progress tracks via transactions
   - **Manual**: Progress tracked by manual completion
6. Click "Add Plan Item"

### Editing Plan Items
1. Click the pencil icon on any plan item
2. Update planned amount, due date, or tracking mode
3. **For Manual tracking:**
   - Use quick percentage buttons (0%, 25%, 50%, 75%, 100%) for fast updates
   - Or set a custom completed amount in the input field
   - Progress updates immediately
4. Save changes

### Quick Completion (Manual Items)
**Directly on the plan page:**
1. Click any percentage button (0%, 25%, 50%, 75%, 100%)
2. Progress bar updates instantly
3. Or use the checkbox for quick 100% toggle

No need to open the edit dialog for common completion percentages!

### Visual Indicators
- **⚡ Auto** badge: Automatic tracking via transactions
- **✓ Manual** badge: Manual tracking with quick actions
- **Checkbox**: Quick toggle for 100% completion
- **Progress Bar**: Visual indicator of completion percentage (manual items only)
- **Quick Action Buttons**: 0%, 25%, 50%, 75%, 100% buttons for easy partial completion
- **Progress Totals**: Shows completed (manual) or actual (automatic) vs planned amounts

## Database Changes

The following fields were added to the `plan_items` table:

- `tracking_mode` (TEXT): Either 'automatic' or 'manual'
- `completed_amount` (DECIMAL): For manual tracking - amount marked as complete
- `is_completed` (BOOLEAN): For manual tracking - whether fully complete

## Migration

To apply this update to your Supabase database:

1. Run the migration script:
   ```bash
   npx supabase migration up
   ```

   Or apply manually in Supabase SQL Editor:
   ```sql
   -- Add tracking_mode column
   ALTER TABLE public.plan_items 
   ADD COLUMN tracking_mode TEXT NOT NULL DEFAULT 'automatic' 
   CHECK (tracking_mode IN ('automatic', 'manual'));

   -- Add completed_amount column for manual tracking
   ALTER TABLE public.plan_items 
   ADD COLUMN completed_amount DECIMAL(12, 2) DEFAULT 0;

   -- Add is_completed column for manual tracking
   ALTER TABLE public.plan_items 
   ADD COLUMN is_completed BOOLEAN DEFAULT false;
   ```

2. All existing plan items will default to 'automatic' tracking mode

## Usage Examples

### Example 1: Rent Payment (Manual)
You know your rent is $1500/month but pay it once. Set up as Manual tracking:
1. Add plan item for "Rent" - $1500
2. Select "Manual" tracking mode
3. When you pay rent, click the "100%" button or check the box
4. Progress shows 100% complete instantly
5. If you pay half now and half later, click "50%" after first payment, then "100%" after second

### Example 2: Groceries (Automatic)
You budget $500/month for groceries. Set up as Automatic tracking:
1. Add plan item for "Groceries" - $500
2. Select "Automatic" tracking mode
3. As you add grocery transactions, progress updates automatically
4. See exactly how much you've spent vs budgeted

### Example 3: Home Improvement Project (Manual)
$2000 project you're working on incrementally:
1. Add plan item for "Kitchen Remodel" - $2000
2. Select "Manual" tracking mode
3. After buying supplies ($500), click "25%" 
4. After more work ($1000 total), click "50%"
5. Track progress as you go, independent of transaction recording

### Example 4: Utilities (Mixed)
You can have some categories as automatic and others as manual within the same budget:
- Electricity (Manual) - click percentage as bill approaches due date
- Gas (Manual) - mark complete when bill is paid
- Streaming services (Automatic) - tracks recurring transactions
- Internet (Manual) - mark complete when paid

## Benefits

- **Flexibility**: Choose the tracking method that fits each expense type
- **Real-time Updates**: Automatic tracking shows live spending data
- **Quick Actions**: One-click percentage buttons for fast manual updates (0%, 25%, 50%, 75%, 100%)
- **Visual Progress**: Clear progress bars show completion status at a glance
- **Manual Control**: Mark items complete on your schedule with granular control
- **Mixed Approach**: Use both methods in the same budget
- **Better Planning**: Track committed expenses separately from variable spending
- **No Dialog Needed**: Update completion directly from the plan view
