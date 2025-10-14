// API Usage Examples

/**
 * This file contains examples of how to use the authentication API
 * and make authenticated requests to your backend
 */

import { api } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { useAppSelector } from "@/lib/store/hooks";

// ============================================
// Example 1: Fetch Data (GET Request)
// ============================================

export async function fetchCompanies() {
  try {
    const companies = await api.get('/admin/companies');
    console.log('Companies:', companies);
    return companies;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
}

// ============================================
// Example 2: Create Data (POST Request)
// ============================================

export async function createCompany(data: {
  name: string;
  email: string;
}) {
  try {
    const newCompany = await api.post('/admin/companies', data);
    console.log('Created company:', newCompany);
    return newCompany;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

// ============================================
// Example 3: Update Data (PUT/PATCH Request)
// ============================================

export async function updateCompany(
  id: string,
  data: { name?: string; email?: string }
) {
  try {
    const updated = await api.patch(`/admin/companies/${id}`, data);
    console.log('Updated company:', updated);
    return updated;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
}

// ============================================
// Example 4: Delete Data (DELETE Request)
// ============================================

export async function deleteCompany(id: string) {
  try {
    await api.delete(`/admin/companies/${id}`);
    console.log('Company deleted successfully');
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
}

// ============================================
// Example 5: Using in a React Component
// ============================================

export function CompaniesListExample() {
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      loadCompanies();
    }
  }, [isAuthenticated]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/companies');
      setCompanies(data);
    } catch (error) {
      console.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/companies/${id}`);
      // Refresh the list
      loadCompanies();
    } catch (error) {
      console.error('Failed to delete company');
    }
  };

  if (!isAuthenticated) {
    return <div>Please login to view companies</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Companies</h2>
      <ul>
        {companies.map((company: any) => (
          <li key={company.id}>
            {company.name}
            <button onClick={() => handleDelete(company.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================
// Example 6: Accessing User Data
// ============================================

export function UserInfoExample() {
  const { user, token, isAuthenticated } = useAuth();

  // Or use Redux selector directly
  const authState = useAppSelector((state) => state.auth);

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Email: {user?.email}</p>
          <p>First Name: {user?.firstName}</p>
          <p>User ID: {user?.id}</p>
          <p>Has Token: {token ? 'Yes' : 'No'}</p>
        </>
      ) : (
        <p>Not authenticated</p>
      )}
    </div>
  );
}

// ============================================
// Example 7: Custom API Request with Options
// ============================================

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Note: For FormData, don't set Content-Type header
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      }
    );

    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// ============================================
// Example 8: Request Without Authentication
// ============================================

export async function fetchPublicData() {
  try {
    // Set requireAuth to false for public endpoints
    const data = await api.get('/public/data', { requireAuth: false });
    return data;
  } catch (error) {
    console.error('Error fetching public data:', error);
    throw error;
  }
}

// ============================================
// Example 9: Error Handling
// ============================================

export async function robustApiCall() {
  try {
    const data = await api.get('/admin/some-endpoint');
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message === 'Unauthorized') {
        console.log('User session expired, redirecting to login...');
        // User is automatically redirected by api client
      } else {
        console.error('API Error:', error.message);
      }
    }
    return { success: false, error };
  }
}

// ============================================
// Example 10: Using with React Query (Optional)
// ============================================

// If you're using @tanstack/react-query, you can integrate like this:
// import { useQuery } from '@tanstack/react-query';
//
// export function useCompanies() {
//   return useQuery({
//     queryKey: ['companies'],
//     queryFn: () => api.get('/admin/companies'),
//   });
// }

export default {
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  uploadFile,
  fetchPublicData,
  robustApiCall,
};

