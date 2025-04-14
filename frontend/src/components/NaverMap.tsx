// /frontend/src/components/NaverMap.tsx

import React, { useEffect, useRef } from "react";

interface NaverMapProps {
  address: string;
}

declare global {
  interface Window {
    naver: any;
  }
}

const NaverMap: React.FC<NaverMapProps> = ({ address }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = "naver-map-script";

    const loadScript = () => {
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=kj6fir6nre&submodules=geocoder&_ts=${Date.now()}`;
        script.async = true;
        script.onload = () => {
          // ✅ 스크립트 로드 후 500ms 딜레이
          setTimeout(initMap, 500);
        };
        script.onerror = () => console.error("네이버 지도 스크립트 로드 실패");
        document.head.appendChild(script);
      } else {
        setTimeout(initMap, 500);
      }
    };

    const initMap = () => {
      console.log("지도 초기화 시작");
      if (!window.naver || !window.naver.maps || !mapRef.current) {
        console.error("네이버 지도 초기화 실패: window.naver.maps 또는 mapRef 없음");
        return;
      }

      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(37.5665, 126.978),
        zoom: 13,
      });

      const geocoder = window.naver.maps.Service;
      if (!geocoder || !geocoder.geocode) {
        console.error("Geocoder 로드 실패");
        return;
      }

      geocoder.geocode({ query: address }, (status: any, response: any) => {
        if (status !== window.naver.maps.Service.Status.OK) {
          console.error("주소 변환 실패:", status);
          return;
        }

        const result = response.v2.addresses[0];
        if (!result) {
          console.error("주소 결과 없음:", address);
          return;
        }

        const location = new window.naver.maps.LatLng(parseFloat(result.y), parseFloat(result.x));

        map.setCenter(location);
        new window.naver.maps.Marker({
          position: location,
          map,
          title: address,
        });
      });
    };

    loadScript();
  }, [address]);

  return <div ref={mapRef} style={{ width: "100%", height: "300px", marginTop: "16px" }} />;
};

export default NaverMap;
