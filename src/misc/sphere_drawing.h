#ifndef CS248_UTIL_SPHEREDRAWING_H
#define CS248_UTIL_SPHEREDRAWING_H

#include "CS248/CS248.h"

namespace CS248 {
namespace Misc {

/**
 * Draws a sphere with the given position and radius in opengl, using the
 * current modelview/projection matrices and the given color.
 */
void draw_sphere_opengl(const Vector3D& p, double r, const Color& c);

/**
 * Draws a sphere with the given position and radius in opengl, using the
 * current modelview/projection matrices and color/material settings.
 */
void draw_sphere_opengl(const Vector3D& p, double r);

}  // namespace Misc
}  // namespace CS248

#endif  // CS248_UTIL_SPHEREDRAWING_H
