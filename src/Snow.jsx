import { useEffect, useRef } from "react";
import lottie from "lottie-web";

export default function Snow() {
    const box = useRef(null);

    useEffect(() => {
        if (!box.current) return;

        const anim = lottie.loadAnimation({
            container: box.current,
            renderer: "svg",
            autoplay: true,
            loop: true,
            path: "/snow.json",
            rendererSettings: {
                preserveAspectRatio: "xMinYMax meet",
            },
        });

        return () => anim.destroy();
    }, []);

    return (
        <div
            ref={box}
            style={{
                width: "100%",
                height: "100%",
                pointerEvents: "none",
            }}
        />
    );
}
