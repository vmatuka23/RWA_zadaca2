import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip adding credentials for local config file
  if (req.url.includes('config.json')) {
    return next(req);
  }
  
  // Clone the request and add withCredentials for API requests
  const clonedRequest = req.clone({
    withCredentials: true
  });
  
  console.log('HTTP Request:', req.method, req.url, 'withCredentials:', true);
  
  return next(clonedRequest);
};
