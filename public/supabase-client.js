// Mr Steeeck — shared Supabase client.
// Every page imports this instead of creating its own client, so we don't
// open multiple redundant connections (including realtime sockets) per page load.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const supabase = createClient(
  'https://tckzvajdoyxpycbzonsf.supabase.co',
  'sb_publishable_ArwWZFwAMOu5mmkwIIQebg_d4xwIUR6'
);

export const ADMIN_EMAILS = ['mainesteeecksupport@gmail.com', 'thegoodguy421@gmail.com'];
