import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create a client with the user's JWT to check their role
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Невалиден потребител' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if the requesting user is admin
    const { data: requestingEmployee } = await userClient
      .from('employees')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!requestingEmployee || requestingEmployee.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Само администратори могат да изтриват служители' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { employee_id } = await req.json()
    if (!employee_id) {
      return new Response(JSON.stringify({ error: 'employee_id е задължително' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create admin client with service role key
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get the employee to find their auth_user_id
    const { data: employee, error: empError } = await adminClient
      .from('employees')
      .select('auth_user_id, full_name')
      .eq('id', employee_id)
      .single()

    if (empError || !employee) {
      return new Response(JSON.stringify({ error: 'Служителят не е намерен' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Prevent self-deletion
    if (employee.auth_user_id === user.id) {
      return new Response(JSON.stringify({ error: 'Не можете да изтриете собствения си акаунт' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Delete the employee record (permissions cascade automatically)
    const { error: deleteEmpError } = await adminClient
      .from('employees')
      .delete()
      .eq('id', employee_id)

    if (deleteEmpError) {
      return new Response(JSON.stringify({ error: `Грешка при изтриване от базата: ${deleteEmpError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Delete the auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(
      employee.auth_user_id
    )

    if (deleteAuthError) {
      console.error('Warning: Employee record deleted but auth user deletion failed:', deleteAuthError)
    }

    return new Response(
      JSON.stringify({ success: true, message: `Служител ${employee.full_name} е изтрит успешно` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
