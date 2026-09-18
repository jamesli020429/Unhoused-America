import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';

function Map() {
    useSEO({ title: 'Map' });
    const [isLoaded, setIsLoaded] = useState(false);

    function resizeIFrameToFitContent(iFrame) {

        iFrame.width = iFrame.contentWindow.document.body.scrollWidth;
        iFrame.height = iFrame.contentWindow.document.body.scrollHeight;
    }

    window.addEventListener('DOMContentLoaded', function (e) {

        var iFrame = document.getElementById('iFrame1');
        resizeIFrameToFitContent(iFrame);

        // or, to resize all iframes:
        var iframes = document.querySelectorAll("iframe");
        for (var i = 0; i < iframes.length; i++) {
            resizeIFrameToFitContent(iframes[i]);
        }
    });

    return (
        <div className="main-content map">
            {!isLoaded && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '1.2em',
                    color: 'var(--primary-purple)',
                    fontFamily: 'var(--quattrocento-font)',
                    zIndex: 2,
                }}>
                    Loading map...
                </div>
            )}
            <iframe
                id="iFrame1"
                title="Map"
                src="https://storymaps.arcgis.com/stories/8f5ee8da0c2948908f6ddc62f1945a93?cover=false"
                width="100%"
                height="500px"
                frameBorder="0"
                allowFullScreen
                allow="geolocation"
                onLoad={() => setIsLoaded(true)}
                className={`map-iframe ${isLoaded ? 'loaded' : 'loading'}`}
            />
        </div>
    );
}
export default Map;
