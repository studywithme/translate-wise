"use client"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false })

export default function SwaggerPage() {
  const [spec, setSpec] = useState<any>(null)
  useEffect(() => {
    fetch("/swagger.yaml")
      .then(res => res.text())
      .then(yaml => import("js-yaml").then(jsyaml => setSpec(jsyaml.load(yaml))))
  }, [])

  return (
    <div style={{ minHeight: "100vh" }}>
      {spec ? (
        <SwaggerUI spec={spec} />
      ) : (
        <div style={{ textAlign: "center", marginTop: 40 }}>Loading Swagger UI...</div>
      )}
    </div>
  )
} 