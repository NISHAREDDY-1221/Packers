import { useLocation, Link } from 'react-router-dom';

// Map path segments to readable labels
const pathLabelMap: Record<string, string> = {
  'user-management': 'User Management',
  'delivery-boys': 'Delivery Agents',
  'requests': 'Delivery Agents',
  'create': 'Create',
  'edit': 'Edit',
  'view': 'View',
  'vendors': 'Vendors',
  'admins': 'Admins',
  'partners': 'Partners',
  'customers': 'Customers',
  'products': 'Products',
  'inventory': 'Inventory Management',
  'operations': 'Operations',
  'monitoring': 'Monitoring',
  'orders': 'Orders',
  'categories': 'Categories',
  'dashboard': 'Dashboard',
  'settings': 'Settings',
  'system': 'System',
  'master-setup': 'Master Setup',
  'home-sliders': 'Home Sliders',
  'offer-images': 'Offer Images',
  'promo-codes': 'Promo Codes',
  'attributes': 'Attributes',
  'unit-types': 'Unit Types',
  'role-management': 'Role Management',
  'countries': 'Countries',
  'states': 'States',
  'districts': 'Districts',
  'areas': 'Areas/Cities',
  'about-us': 'About Us',
  'terms-conditions': 'Terms and Conditions',
  'privacy-policy': 'Privacy Policy',
  'sub-categories': 'Sub Category',
  'reports': 'Reports',
  'access-management': 'Access Management',
};

// Format a path segment to a readable label
const formatLabel = (segment: string): string => {
  // Check if we have a direct mapping
  if (pathLabelMap[segment]) {
    return pathLabelMap[segment];
  }

  // Handle dynamic IDs (numbers or UUIDs)
  if (/^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return segment;
  }

  // Convert kebab-case to Title Case
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Map of parent routes for navigation
const parentRouteMap: Record<string, string> = {
  'user-management': '/user-management/admins',
  'delivery-boys': '/delivery-boys/manage',
  'vendors': '/vendors/manage',
  'products': '/products/manage',
  'categories': '/categories/manage',
  'orders': '/orders',
  'inventory': '/inventory/overview',
  'home-sliders': '/home-sliders/manage',
  'offer-images': '/offer-images/manage',
  'promo-codes': '/promo-codes/manage',
  'featured-sections': '/featured-sections',
  'attributes': '/master-setup/attributes',
  'unit-types': '/master-setup/unit-types',
  'role-management': '/master-setup/role-management',
  'countries': '/master-setup/countries',
  'states': '/master-setup/states',
  'districts': '/master-setup/districts',
  'areas': '/master-setup/areas',
  'system': '/system/store-settings',
  'reports': '/reports/access-management',
  'access-management': '/reports/access-management',
};

const getBreadcrumbs = (pathname: string): Array<{ label: string; path?: string }> => {
  const breadcrumbs: Array<{ label: string; path?: string }> = [];

  // Always start with Home
  breadcrumbs.push({ label: 'Home', path: '/' });

  // Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);

  // Routes that belong to User Management (excluding vendors - vendors have their own breadcrumb structure)
  const userManagementRoutes = ['delivery-boys', 'user-management'];
  const isUserManagementRoute = userManagementRoutes.some(route => pathname.startsWith(`/${route}`));

  // Add User Management if route belongs to it (but not for vendors)
  if (isUserManagementRoute) {
    breadcrumbs.push({ label: 'User Management', path: '/user-management/admins' });
  }

  // Check if this is a vendor route
  const isVendorRoute = pathname.startsWith('/vendors');

  // Add Vendor Management as parent for all vendor routes
  if (isVendorRoute) {
    breadcrumbs.push({ label: 'Vendor Management', path: '/vendors/manage' });
  }

  // Build breadcrumb path incrementally
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;

    // Special handling for delivery-boys routes
    if (segment === 'delivery-boys') {
      // Skip the segment itself, we'll handle it in the next segment
      return;
    }

    if (segment === 'requests' && segments[index - 1] === 'delivery-boys') {
      // For delivery-boys/requests, show as "Delivery Agents"
      breadcrumbs.push({
        label: 'Delivery Agents',
        path: '/delivery-boys/requests'
      });
      return;
    }

    // Handle delivery-boys/manage and other delivery-boys routes
    if (segments[index - 1] === 'delivery-boys' && segment !== 'delivery-boys') {
      // Add "Delivery Agents" as parent before the current segment
      if (segment === 'manage') {
        breadcrumbs.push({
          label: 'Delivery Agents',
          path: '/delivery-boys/manage'
        });
      } else if (segment !== 'requests') {
        // For other delivery-boys routes (create, view, etc.), show Delivery Agents pointing to manage
        breadcrumbs.push({
          label: 'Delivery Agents',
          path: '/delivery-boys/manage'
        });
      }
    }

    // Skip 'user-management' segment since we already added it
    if (segment === 'user-management') {
      // Determine which sub-route to use
      if (segments[index + 1] === 'admins') {
        breadcrumbs.push({
          label: 'Admins',
          path: '/user-management/admins'
        });
        return;
      } else if (segments[index + 1] === 'partners') {
        breadcrumbs.push({
          label: 'Partners',
          path: '/user-management/partners'
        });
        return;
      }
      return;
    }

    // Skip 'vendors' segment since we already added "Vendor Management"
    if (segment === 'vendors') {
      return;
    }

    // Special handling for vendors/manage - show as "Manage Vendors"
    if (segment === 'manage' && segments[index - 1] === 'vendors') {
      breadcrumbs.push({
        label: 'Manage Vendors',
        path: '/vendors/manage'
      });
      return;
    }

    // Special handling for vendors/requests - show as "New Registered Vendors"
    if (segment === 'requests' && segments[index - 1] === 'vendors') {
      breadcrumbs.push({
        label: 'New Registered Vendors',
        path: '/vendors/requests'
      });
      return;
    }

    // Special handling for vendors/wallet-transactions - show as "Wallet Transactions"
    if (segment === 'wallet-transactions' && segments[index - 1] === 'vendors') {
      // If next segment is 'view' or 'edit' or 'create', don't add it here, let it be handled by the action handler
      if (segments[index + 1] && ['view', 'edit', 'create'].includes(segments[index + 1])) {
        breadcrumbs.push({
          label: 'Wallet Transactions',
          path: '/vendors/wallet-transactions'
        });
        return;
      }
      breadcrumbs.push({
        label: 'Wallet Transactions',
        path: '/vendors/wallet-transactions'
      });
      return;
    }

    // Special handling for vendors/policies - show as "Vendor Policies"
    if (segment === 'policies' && segments[index - 1] === 'vendors') {
      breadcrumbs.push({
        label: 'Vendor Policies',
        path: '/vendors/policies'
      });
      return;
    }

    // Special handling for delivery-boys/manage - show as "Manage"
    if (segment === 'manage' && segments[index - 1] === 'delivery-boys') {
      breadcrumbs.push({
        label: 'Manage',
        path: isLast ? undefined : '/delivery-boys/manage'
      });
      return;
    }

    // Special handling for user-management/admins - show as "Admins"
    if (segment === 'admins' && segments[index - 1] === 'user-management') {
      breadcrumbs.push({
        label: 'Admins',
        path: '/user-management/admins'
      });
      return;
    }

    // Special handling for user-management/partners - show as "Partners"
    if (segment === 'partners' && segments[index - 1] === 'user-management') {
      breadcrumbs.push({
        label: 'Partners',
        path: '/user-management/partners'
      });
      return;
    }

    if (segment === 'customers' && segments[index - 1] === 'user-management') {
      breadcrumbs.push({
        label: 'Customers',
        path: '/user-management/customers'
      });
      return;
    }

    // Special handling for attributes view - just show "View" without ID
    if (segment === 'view' && segments[index - 1] === 'attributes') {
      breadcrumbs.push({
        label: 'View',
        path: isLast ? undefined : currentPath
      });
      // Skip the next segment (ID) by returning here
      return;
    }

    // Special handling for countries view - show ID #123 format
    if (segment === 'view' && segments[index - 1] === 'countries' && segments[index + 1]) {
      breadcrumbs.push({
        label: `ID #${segments[index + 1]}`,
        path: isLast ? undefined : currentPath
      });
      return;
    }

    // Special handling for states view - show ID #123 format
    if (segment === 'view' && segments[index - 1] === 'states' && segments[index + 1]) {
      breadcrumbs.push({
        label: `ID #${segments[index + 1]}`,
        path: isLast ? undefined : currentPath
      });
      return;
    }

    // Special handling for districts view - show ID #123 format
    if (segment === 'view' && segments[index - 1] === 'districts' && segments[index + 1]) {
      breadcrumbs.push({
        label: `ID #${segments[index + 1]}`,
        path: isLast ? undefined : currentPath
      });
      return;
    }

    // Special handling for areas view - show ID #123 format
    if (segment === 'view' && segments[index - 1] === 'areas' && segments[index + 1]) {
      breadcrumbs.push({
        label: `ID #${segments[index + 1]}`,
        path: isLast ? undefined : currentPath
      });
      return;
    }

    // Special handling for sub-categories view - show "View" only (do not show ID)
    if (segment === 'view' && segments[index - 1] === 'sub-categories') {
      breadcrumbs.push({
        label: 'View',
        path: isLast ? undefined : currentPath
      });
      return;
    }

    // Special handling for categories view - show "View" only (do not show ID)
    if (segment === 'view' && segments[index - 1] === 'categories') {
      breadcrumbs.push({
        label: 'View',
        path: isLast ? undefined : currentPath
      });
      return;
    }

    // Special handling for "manage" segment - link to the manage page
    if (segment === 'manage') {
      const parentSegment = segments[index - 1];
      const managePath = parentSegment ? `/${parentSegment}/manage` : currentPath;
      breadcrumbs.push({
        label: 'Manage',
        path: isLast ? undefined : managePath
      });
      return;
    }

    // For create/edit/view pages, show the action
    if (['create', 'edit', 'view'].includes(segment)) {
      breadcrumbs.push({
        label: formatLabel(segment),
        path: isLast ? undefined : currentPath
      });
      return;
    }

    // Skip numeric IDs and UUIDs in breadcrumbs (they're not user-friendly)
    if (/^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      return;
    }

    // Get parent route if available
    const parentRoute = parentRouteMap[segment];

    // Add the segment
    breadcrumbs.push({
      label: formatLabel(segment),
      path: isLast ? undefined : (parentRoute || currentPath)
    });
  });

  return breadcrumbs;
};

const Breadcrumbs = () => {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-1 mb-3">
      {breadcrumbs.map((crumb, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <span className="mx-1">&gt;</span>}
          {index === 0 ? (
            <Link
              to="/"
              className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span
              className={
                index === breadcrumbs.length - 1
                  ? 'font-medium text-orange-600 dark:text-orange-500'
                  : 'font-medium text-gray-700 dark:text-gray-300'
              }
            >
              {crumb.label}
            </span>
          )}

          {/* {crumb.path && index < breadcrumbs.length - 1 ? (
            <Link to={crumb.path} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className={index === breadcrumbs.length - 1 ? 'font-medium text-orange-600 dark:text-orange-500' : 'font-medium text-gray-700 dark:text-gray-300'}>
              {crumb.label}
            </span>
          )} */}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
