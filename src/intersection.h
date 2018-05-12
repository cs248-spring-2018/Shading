#ifndef CS248_INTERSECT_H
#define CS248_INTERSECT_H

#include <vector>

#include "CS248/vector3D.h"
#include "CS248/spectrum.h"
#include "CS248/misc.h"

#include "bsdf.h"

namespace CS248 {
namespace StaticScene {

class Primitive;

/**
 * A record of an intersection point which includes the time of intersection
 * and other information needed for shading
 */
struct Intersection {
  Intersection() : t(INF_D), primitive(NULL), bsdf(NULL) {}

  double t;  ///< time of intersection

  const Primitive* primitive;  ///< the primitive intersected

  Vector3D n;  ///< normal at point of intersection

  BSDF* bsdf;  ///< BSDF of the surface at point of intersection

};

}  // namespace StaticScene
}  // namespace CS248

#endif  // CS248_INTERSECT_H
