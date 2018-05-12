#ifndef CS248_COLLADA_MATERIALINFO_H
#define CS248_COLLADA_MATERIALINFO_H

#include "CS248/color.h"
#include "collada_info.h"
#include "../bsdf.h"

namespace CS248 {
namespace Collada {

struct MaterialInfo : public Instance {
  BSDF* bsdf;

  // Texture* tex; ///< texture

};  // struct Material

std::ostream& operator<<(std::ostream& os, const MaterialInfo& material);

}  // namespace Collada
}  // namespace CS248

#endif  // CS248_COLLADA_MATERIALINFO_H
