"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { AuthGuard } from '@/components/admin/auth-guard';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { analyticsApi, UserLocationDTO } from '@/lib/api/analytics';
import { get, set } from 'idb-keyval';
import { APIProvider, Map, useMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import useSupercluster from 'use-supercluster';
import { RefreshCw, MapPin, Users, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CACHE_KEY = 'hirenest_user_locations';
const CACHE_TIME_KEY = 'hirenest_user_locations_timestamp';

// Helper component to handle map events and clustering
const ClusteredMarkers = ({ data }: { data: UserLocationDTO[] }) => {
  const map = useMap();
  const [bounds, setBounds] = useState<number[] | null>(null);
  const [zoom, setZoom] = useState(2);

  // Update bounds and zoom when the map moves
  useEffect(() => {
    if (!map) return;

    const updateBounds = () => {
      const currentBounds = map.getBounds();
      if (currentBounds) {
        setBounds([
          currentBounds.getSouthWest().lng(),
          currentBounds.getSouthWest().lat(),
          currentBounds.getNorthEast().lng(),
          currentBounds.getNorthEast().lat(),
        ]);
      }
      setZoom(map.getZoom() || 2);
    };

    updateBounds();

    map.addListener('idle', updateBounds);
    return () => {
      google.maps.event.clearListeners(map, 'idle');
    };
  }, [map]);

  // Convert data to GeoJSON format for supercluster
  const points = useMemo(() => {
    return data.map((user) => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        userId: user._id,
        userType: user.type,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [user.lng, user.lat],
      },
    }));
  }, [data]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: bounds as any,
    zoom,
    options: { radius: 75, maxZoom: 20 },
  });

  return (
    <>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount } = cluster.properties as any;

        if (isCluster) {
          // Render a cluster bubble
          const size = Math.min(40 + (pointCount / points.length) * 40, 80);
          return (
            <AdvancedMarker
              key={`cluster-${cluster.id}`}
              position={{ lat: latitude, lng: longitude }}
              onClick={() => {
                const expansionZoom = Math.min(
                  supercluster.getClusterExpansionZoom(cluster.id as number),
                  20
                );
                map?.setZoom(expansionZoom);
                map?.panTo({ lat: latitude, lng: longitude });
              }}
            >
              <div
                className="flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg font-bold text-sm"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  opacity: 0.9,
                  border: '3px solid white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {pointCount}
              </div>
            </AdvancedMarker>
          );
        }

        // Render an individual marker
        const isProvider = cluster.properties.userType === 'jobprovider';
        return (
          <AdvancedMarker
            key={`point-${cluster.properties.userId}`}
            position={{ lat: latitude, lng: longitude }}
          >
            <div
              className={`p-1 rounded-full shadow-md border-2 border-white ${
                isProvider ? 'bg-orange-500' : 'bg-blue-500'
              }`}
              style={{ cursor: 'pointer' }}
              title={isProvider ? 'Job Provider' : 'Job Seeker'}
            >
              {isProvider ? (
                <Building2 size={16} className="text-white" />
              ) : (
                <Users size={16} className="text-white" />
              )}
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
};

export default function UserMapPage() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<UserLocationDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  // Filters
  const [showSeekers, setShowSeekers] = useState(true);
  const [showProviders, setShowProviders] = useState(true);

  const loadFromCache = async () => {
    try {
      const cachedLocations = await get(CACHE_KEY);
      const cachedTime = await get(CACHE_TIME_KEY);
      
      if (cachedLocations && cachedTime) {
        setLocations(cachedLocations);
        setLastSynced(new Date(cachedTime));
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.error('Failed to read from IndexedDB', err);
    }
    return false;
  };

  const syncData = async () => {
    setIsLoading(true);
    try {
      const response = await analyticsApi.getUserLocations();
      const data = response.data;
      const now = new Date();
      
      // Save to IndexedDB
      await set(CACHE_KEY, data);
      await set(CACHE_TIME_KEY, now.getTime());
      
      setLocations(data);
      setLastSynced(now);
      
      toast({
        title: 'Map Synced',
        description: `Successfully loaded ${data.length} user locations.`,
      });
    } catch (error) {
      console.error('Failed to sync map data:', error);
      toast({
        title: 'Sync Failed',
        description: 'Could not fetch latest location data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load: check cache first, if empty, sync.
    const init = async () => {
      const hasCache = await loadFromCache();
      if (!hasCache) {
        await syncData();
      }
    };
    init();
  }, []);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (loc.type === 'jobseeker' && !showSeekers) return false;
      if (loc.type === 'jobprovider' && !showProviders) return false;
      return true;
    });
  }, [locations, showSeekers, showProviders]);

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="space-y-6 h-full flex flex-col min-h-[calc(100vh-100px)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <PageHeader title="Global User Map" description="Visualize where job seekers and providers are located." />
            
            <div className="flex items-center gap-4">
              {lastSynced && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Synced {formatDistanceToNow(lastSynced, { addSuffix: true })}
                </div>
              )}
              <Button onClick={syncData} disabled={isLoading} variant="outline" size="sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Syncing...' : 'Sync Cloud Data'}
              </Button>
            </div>
          </div>

          <Card className="flex-1 relative overflow-hidden rounded-xl border bg-muted/50 min-h-[600px]">
            {/* Floating Filter Widget */}
            <div className="absolute top-4 left-4 z-10 bg-background/95 backdrop-blur shadow-lg rounded-lg p-4 border w-64 space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Map Filters
              </h3>
              
              <div className="space-y-3">
                <Button 
                  variant={showSeekers ? "default" : "outline"}
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowSeekers(!showSeekers)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Job Seekers
                  <Badge variant="secondary" className="ml-auto bg-blue-500 text-white hover:bg-blue-600">
                    {locations.filter(l => l.type === 'jobseeker').length}
                  </Badge>
                </Button>

                <Button 
                  variant={showProviders ? "default" : "outline"}
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowProviders(!showProviders)}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Job Providers
                  <Badge variant="secondary" className="ml-auto bg-orange-500 text-white hover:bg-orange-600">
                    {locations.filter(l => l.type === 'jobprovider').length}
                  </Badge>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t text-center">
                Showing {filteredLocations.length} locations
              </div>
            </div>

            {/* Google Map */}
            {mapsApiKey ? (
              <div className="absolute inset-0 z-0">
                <APIProvider apiKey={mapsApiKey}>
                  <Map
                    style={{ width: '100%', height: '100%' }}
                    defaultCenter={{ lat: 20.5937, lng: 78.9629 }} // Default to India
                    defaultZoom={4}
                    mapId="DEMO_MAP_ID" // Use DEMO_MAP_ID to ensure AdvancedMarkers work
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                    zoomControl={true}
                    mapTypeControl={false}
                    streetViewControl={false}
                  >
                    <ClusteredMarkers data={filteredLocations} />
                  </Map>
                </APIProvider>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center flex-col gap-4 text-muted-foreground">
                <MapPin className="h-12 w-12 opacity-20" />
                <p>Google Maps API key not found in environment variables.</p>
              </div>
            )}
          </Card>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
